const posAttributeIndex = 0;
const normAttributeIndex = 1;
const colorAttributeIndex = 2;
var maze = GetMazeObject(),
	gl = null,
	mvp_loc,
	lightDir_loc,
	halfWay_loc,
	colDiffuse_loc,
	square,
	wall,
	sign,
	N = maze.SizeOfTheMaze,
	mvp,
	qcurr = identityQuat(),
	rotation = identityMatrix();

	//objMesh = [],
	//colDiffuse = [1.0, 0.0, 1.0];
	//matWorldUniformLocation;

/*function setColor(r, g, b) {
	colDiffuse[0] = r;
	colDiffuse[1] = g;
	colDiffuse[2] = b;
}*/

var trackball = {
	x0: 0.0,
	x1: 0.0,
	y0: 0.0,
	y1: 0.0,
	r: 0.3,
	d: 10,
	zoom: false,
	getView: function() {
		var p0 =  [this.x0, this.y0, 0],
			p1 =  [this.x1, this.y1, 0],
			origin = [0, 0, -this.d];

		var p0Signed = multScalarVector(Math.sqrt(Math.pow(this.r, 2) /
									   (Math.pow(p0[0], 2) + Math.pow(p0[1], 2)
									    + Math.pow(this.d, 2))), p0),
			p1Signed = multScalarVector(Math.sqrt(Math.pow(this.r, 2) /
									   (Math.pow(p1[0], 2) + Math.pow(p1[1], 2)
									    + Math.pow(this.d, 2))), p1);

		if(!this.zoom) {
			var rotAxis = crossProduct(subVectors(p1, origin),
									   subVectors(p0, origin));
		    if (magnitudeVector(rotAxis) != 0)
		   		rotAxis = normVec(rotAxis);

			var alpha = -magnitudeVector(subVectors(p1Signed, p0Signed));

			var qnew = axisAngle2Quat(rotAxis, alpha);
			qcurr = multQuat(qcurr, qnew);
			rotation = quat2Matrix(qcurr);
		}

		var res = identityMatrix();
		var trans = translationMatrix(0, 0, -this.d);
		var rm = rotationXMatrix(90);

		res = multMatrix(res, trans);
		res = multMatrix(res, rotation);
		res = multMatrix(res, rm);

		return res;
	}
}

function setupWebGL() {
	var canvas = document.getElementById('maze_canvas');
	gl = canvas.getContext('experimental-webgl');
}

function setupWhatToDraw() {
	var unaMesh = Object.create(CPUmesh);

	square = Object.create(GPUmesh);
	wall = Object.create(GPUmesh);
	sign = Object.create(GPUmesh);
	objMesh = [
		Object.create(GPUmesh),
		Object.create(GPUmesh),
		Object.create(GPUmesh)
	]
	square.init(gl);
	wall.init(gl);
	sign.init(gl);
	for(var i = 0; i < 3; i++)
		objMesh[i].init(gl);

	unaMesh.makeSquare(0.3, 0.2, 0);
	square.storeFromCpu(gl, unaMesh);
	unaMesh.makeCube();
	wall.storeFromCpu(gl, unaMesh);
	unaMesh.makeCone(30);
	sign.storeFromCpu(gl, unaMesh);

	readTextFile('apple.off', objMesh[0]);
	readTextFile('mushroom.off', objMesh[1]);
	readTextFile('teapot.off', objMesh[2]);

}

function setupHowToDraw() {
	gl.disable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);

	var vsSource = document.getElementById("vertexShader").textContent;
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);

	var fsSource = document.getElementById("fragmentShader").textContent;
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);

	var myProgram = gl.createProgram();
    gl.attachShader(myProgram, vertexShader);
    gl.attachShader(myProgram, fragmentShader);

	gl.bindAttribLocation(myProgram, posAttributeIndex, "vertexPos");
    gl.bindAttribLocation(myProgram, normAttributeIndex, "normal");
	gl.bindAttribLocation(myProgram, colorAttributeIndex, "color");
    gl.linkProgram(myProgram);

	mvp_loc = gl.getUniformLocation(myProgram, "mvp");
    lightDir_loc = gl.getUniformLocation(myProgram, "lightDir");
    halfWay_loc = gl.getUniformLocation(myProgram, "halfWay");
    //colDiffuse_loc = gl.getUniformLocation(myProgram, "colDiffuse");
    gl.useProgram(myProgram);
}

function setUniforms(){
        var view = trackball.getView();
        var aspectRatio = 700.0 / 700.0 ;
        //var projection = perspectiveMatrixFOV(75, aspectRatio, 0.1, 1000.0);
		var projection = perspectiveMatrixFOV(80, aspectRatio, 0.5, 50.0);

        mvp = multMatrix(view, model.top());
        mvp = multMatrix(projection, mvp);

        gl.uniformMatrix4fv(mvp_loc, false, new Float32Array(mvp));

        //ILLUMINAZIONE
        var lightDir = [0, 0, 5, 0];
        var viewDir = [0, 0, 1, 0];
        var halfWay = [];

        var modelInv = invMatrix4(model.top());
        var viewInv = invMatrix4(view);

		var useHeadLight = document.getElementById("headlightCB").checked;
        if (useHeadLight) {
          lightDir = multMatrixVec(viewInv, lightDir);
        }

        lightDir = multMatrixVec(modelInv, lightDir);
        lightDir = normVec(lightDir);

        viewDir = multMatrixVec(viewInv, viewDir);
        viewDir = multMatrixVec(modelInv, viewDir);
        viewDir = normVec(viewDir);

        halfWay = [viewDir[0] + lightDir[0],
                   viewDir[1] + lightDir[1],
                   viewDir[2] + lightDir[2],
                   0];
        halfWay = normVec(halfWay);

        gl.uniform3f(lightDir_loc, lightDir[0], lightDir[1], lightDir[2]);
        gl.uniform3f(halfWay_loc, halfWay[0], halfWay[1], halfWay[2]);
        /*gl.uniform3f(colDiffuse_loc, colDiffuse[0],
					 colDiffuse[1], colDiffuse[2]);*/

    }

function drawSquare() {
	model.push();
	model.translate(-N/2, 0, -N/2);
	model.scale(N, 1, N);
	setUniforms();
	square.draw(gl);
	model.pop();
}

function drawHorizontalWall(index, startPos, length) {
	model.push();
	model.translate(-(N/2 - startPos + length), 0, -(N/2 - index));
	model.scale(length, 1.5, 1/4);
	setUniforms();
	wall.draw(gl);
	model.pop();
}

function drawVerticalWall(index, startPos, length) {
	model.push();
	model.translate(-(N/2 - index), 0, -(N/2 - startPos + length));
	model.scale(1/4, 1.5, length);
	setUniforms();
	wall.draw(gl);
	model.pop();
}

function drawSign(x, y) {
	model.push();
	model.translate((-N/2)+x, 1/2, (N/2)-y);
	model.scale(1/5, 1/5, 1/5);
	setUniforms();
	sign.draw(gl);
	model.pop();
}

function drawMesh(index, x, y) {
	model.push();
	model.translate((-N/2)+x, 1/2, (N/2)-y);
	model.scale(1/5, 1/5, 1/5);
	setUniforms();
	objMesh[index].draw(gl);
	model.pop();
}

function draw() {
	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	model.init();
	drawSquare();

	var startPos,
		length;
	for(var i = 0; i <= N; i++)
		for(var j = 0; j < maze.HorizontalWallsLoc[i].length; j += 2) {
			startPos = maze.HorizontalWallsLoc[i][j];
			length = maze.HorizontalWallsLoc[i][j + 1];
			if(i == 0 || i == N)
				drawHorizontalWall(i, startPos, length + 1);
			else
				drawHorizontalWall(i, startPos, length);
		}
	for(var i = 0; i <= N; i++)
		for(var j = 0; j < maze.VerticalWallsLoc[i].length; j += 2) {
			startPos = maze.VerticalWallsLoc[i][j];
			length = maze.VerticalWallsLoc[i][j + 1];
			if(i == 0 || i == N)
				drawVerticalWall(i, startPos, length + 1);
			else
				drawVerticalWall(i, startPos, length);
		}

	/*for(var i = 0; i < maze.Rooms.length; i += 2)
		drawSign(maze.Rooms[i], maze.Rooms[i + 1]);*/
	for(var i = 0; i < maze.Rooms.length; i += 2)
		drawMesh(i/2, maze.Rooms[i], maze.Rooms[i + 1]);
}

function myOnLoad() {
    setupWebGL();
    setupWhatToDraw();
    setupHowToDraw();
    draw();
}

function resetView() {
	trackball.d = 10;
	trackball.x0 = 0.0;
	trackball.y0 = 0.0;
	trackball.x1 = 0.0;
	trackball.y1 = 0.0;

	rotation = identityMatrix();
	qcurr = identityQuat();

	draw();
}

function readTextFile(filename, myGpuMesh) {
    var rawFile = new XMLHttpRequest() || new ActiveXObject('MSXML2.XMLHTTP');
    rawFile.open("GET", filename, true);
    rawFile.onreadystatechange = function() {
        if(rawFile.readyState === 4 && rawFile.status === 200) {
            var allText = rawFile.responseText;
            var myCpuMesh = Object.create(CPUmesh);
	        myCpuMesh.importOFFfromString(allText);
	        myCpuMesh.updateAABB();
            myCpuMesh.updateNormals();
            myCpuMesh.autocenterNormalize();
	        myGpuMesh.storeFromCpu(gl, myCpuMesh);
            draw();
        }
    }
    rawFile.send();
}


var lastMousePosX, lastMousePosY;

function mouseDown(event) {
    var xPos = event.clientX,
    	yPos = event.clientY,
    	leftEdge = maze_canvas.getBoundingClientRect().left,
    	topEdge = maze_canvas.getBoundingClientRect().top;

    /*lastMousePosX = (xPos - leftEdge - 700 / 2.0) / (700 / 2.0);
    lastMousePosY = (700 / 2.0 + topEdge - yPos) / (700 / 2.0);*/
	lastMousePosX = 2 * xPos / 700 - 1;
	lastMousePosY = 2 * (700 - yPos) / 700 - 1;
}

function mouseMove(event) {
	if(event.buttons == 0) return;

	if(event.buttons == 1) {
		trackball.x0 = lastMousePosX;
		trackball.y0 = lastMousePosY;

		var xPos = event.clientX,
			yPos = event.clientY,
			leftEdge = maze_canvas.getBoundingClientRect().left,
			topEdge = maze_canvas.getBoundingClientRect().top;

		/*lastMousePosX = (xPos - leftEdge - 700 / 2.0) / (700 / 2.0);
		lastMousePosY = (700 / 2.0 + topEdge - yPos) / (700 / 2.0);*/
		lastMousePosX = 2 * xPos / 700 - 1;
		lastMousePosY = 2 * (700 - yPos) / 700 - 1;
		trackball.x1 = lastMousePosX;
		trackball.y1 = lastMousePosY;
	}
	draw();
}


function mouseUp(event) {}

function wheelScroll(event) {
	var newD = trackball.d + event.deltaY/15;

	trackball.d = newD > 5 ? newD : 5;

	event.preventDefault();

	trackball.zoom = true;
	draw();
	trackball.zoom = false;
}



window.onload = myOnLoad;
window.onmousemove = mouseMove;
window.onmousedown = mouseDown;
window.onmouseup = mouseUp;
window.onwheel = wheelScroll;
