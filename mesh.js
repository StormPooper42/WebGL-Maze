var GPUmesh = {
	bufferVerts : 0,
   	bufferTris : 0,
   	nTris : 0,
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    minZ: 0,
    maxZ: 0,

   	init : function(gl) {
		this.bufferVerts = gl.createBuffer();
		this.bufferTris = gl.createBuffer();
		this.nTris = 0;
   	},

	draw : function(gl) {
      	gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVerts);

      	gl.enableVertexAttribArray(posAttributeIndex);
      	gl.vertexAttribPointer(posAttributeIndex, 3, gl.FLOAT, false, 9*4, 0);

      	gl.enableVertexAttribArray(normAttributeIndex);
      	gl.vertexAttribPointer(normAttributeIndex, 3, gl.FLOAT, false, 9*4, 3*4);

		gl.enableVertexAttribArray(colorAttributeIndex);
		gl.vertexAttribPointer(colorAttributeIndex, 3, gl.FLOAT, false, 9*4, 6*4);

      	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufferTris);

      	gl.drawElements(gl.TRIANGLES, this.nTris*3, gl.UNSIGNED_SHORT, 0);
   },

   storeFromCpu : function(gl, mesh) {
        this.nTris = mesh.tris.length / 3;
        /*this.minX = mesh.minX;
        this.maxX = mesh.maxX;
        this.minY = mesh.minY;
        this.maxY = mesh.maxY;
        this.minZ = mesh.minZ;
        this.maxZ = mesh.maxZ;*/

        this.bufferVerts = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVerts);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.verts, gl.STATIC_DRAW);

        this.bufferTris = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufferTris);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.tris, gl.STATIC_DRAW);
   }
};

var CPUmesh = {
	verts: new Float32Array,
    tris: new Uint16Array,
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    minZ: 0,
    maxZ: 0,

	// shortcuts
	vx: function(i) { return  this.verts[i*9+0]; },
	vy: function(i) { return  this.verts[i*9+1]; },
	vz: function(i) { return  this.verts[i*9+2]; },

	nx: function(i) { return  this.verts[i*9+3]; },
	ny: function(i) { return  this.verts[i*9+4]; },
	nz: function(i) { return  this.verts[i*9+5]; },

	r: function(i) { return this.verts[i*9+6]; },
	g: function(i) { return this.verts[i*9+7]; },
	b: function(i) { return this.verts[i*9+8]; },

	nv: function() { return this.verts.length/9; },
	nf: function() { return this.tris.length/3; },

	// returns position of vert number i
	posOfVert: function(i) {
		return [this.vx(i), this.vy(i), this.vz(i)];
	},

	// returns normal of vert number i
	normalOfVert: function(i) {
		return [this.nx(i), this.ny(i), this.nz(i)];
	},

	// sets the normal of vert i
	setNormalOfVert: function(i, n) {
		this.verts[i*9+3] = n[0];
		this.verts[i*9+4] = n[1];
		this.verts[i*9+5] = n[2];
	},

	// returns normal of face number i
	normalOfFace: function(i) {
		var vi, vj, vk;
		vi = this.tris[i*3 + 0];
		vj = this.tris[i*3 + 1];
		vk = this.tris[i*3 + 2];
		var pi,pj,pk;
		pi = this.posOfVert(vi);
		pj = this.posOfVert(vj);
		pk = this.posOfVert(vk);
		var norm = crossProduct(subVectors(pi, pk), subVectors(pj, pk));
		return normalizeVector(norm);
	},

	importOFFfromString:function (string) {
    string.replace("\n ", "\n");
 		var tokens = string.split(/\s+/);
 		var ti = 0; // token index
 		ti++; // skip "OFF"
 		var nv = tokens[ti++]; // number of vertices
 		var nf = tokens[ti++]; // number of faces
 		ti++; // skip number of edges

 		this.verts = new Float32Array(nv*6);

 		for (var i=0; i<nv; i++) {
 			this.verts[i*6 + 0] = tokens[ti++]; // X
 			this.verts[i*6 + 1] = tokens[ti++]; // Y
 			this.verts[i*6 + 2] = tokens[ti++]; // Z
 		}

 		this.tris = new Uint16Array( nf*3 );
 		for (var i=0; i<nf; i++) {
 			if (tokens[ti++]!=3) { // number of edges (3?)
                 return;
             }
 			this.tris[ i*3 + 0 ] = tokens[ti++]; // v0
 			this.tris[ i*3 + 1 ] = tokens[ti++]; // v1
 			this.tris[ i*3 + 2 ] = tokens[ti++]; // v2
 		}
	},

	//updates the bounding box dimensions
	updateAABB: function(){
		if (this.nv()==0) return;
		this.minX = this.maxX = this.vx(0);
		this.minY = this.maxY = this.vy(0);
		this.minZ = this.maxZ = this.vz(0);
		for (var i=1; i<this.nv(); i++) {
			if (this.minX>this.vx(i)) this.minX = this.vx(i);
			if (this.maxX<this.vx(i)) this.maxX = this.vx(i);
			if (this.minY>this.vy(i)) this.minY = this.vy(i);
			if (this.maxY<this.vy(i)) this.maxY = this.vy(i);
			if (this.minZ>this.vz(i)) this.minZ = this.vz(i);
			if (this.maxZ<this.vz(i)) this.maxZ = this.vz(i);
		}
	},

	updateNormals: function(){
		// 1: clear all normals
		for(var i = 0; i < this.nv(); i++)
			this.setNormalOfVert(i, [0, 0, 0]);
		// 2: cumulate normals of all faces on their three vertices
		for(var i = 0; i < this.nf(); i++) {
			var n = this.normalOfFace(i);
			var vi, vj, vk; // indices of the three vertices of face i
			vi = this.tris[i*3 + 0];
			vj = this.tris[i*3 + 1];
			vk = this.tris[i*3 + 2];
			this.setNormalOfVert(vi, sumVectors(n, this.normalOfVert(vi)));
			this.setNormalOfVert(vj, sumVectors(n, this.normalOfVert(vj)));
			this.setNormalOfVert(vk, sumVectors(n, this.normalOfVert(vk)));
		}
		// 3: normalize all normals
		for(var i = 0; i < this.nv(); i++)
			this.setNormalOfVert(i, normalizeVector(this.normalOfVert(i)));
	},

	// centers and rescales the mesh
	// invoke AFTER updating AABB
	autocenterNormalize: function(){
		var tr = translationMatrix(
		    -(this.minX+this.maxX)/2.0,
		    -(this.minY+this.maxY)/2.0,
		    -(this.minZ+this.maxZ)/2.0
		);
		var dimX = this.maxX-this.minX;
		var dimY = this.maxY-this.minY;
		var dimZ = this.maxZ-this.minZ;
		var dimMax = Math.max(dimZ, dimY, dimX);
        for (var i=0; i<this.nv(); i++) {
			this.verts[i*9 + 0] = (this.verts[i*9 + 0]-(this.minX+this.maxX)/2.0)*2.0/dimMax; // X
			this.verts[i*9 + 1] = (this.verts[i*9 + 1]-(this.minY+this.maxY)/2.0)*2.0/dimMax; // Y
			this.verts[i*9 + 2] = (this.verts[i*9 + 2]-(this.minZ+this.maxZ)/2.0)*2.0/dimMax; // Z
		}
        this.minX = (this.minX-this.maxX)/dimMax;
        this.maxX = (this.maxX-this.minX)/dimMax;
        this.minY = (this.minY-this.maxY)/dimMax;
        this.maxY = (this.maxY-this.minY)/dimMax;
        this.minZ = (this.minZ-this.maxZ)/dimMax;
        this.maxZ = (this.maxZ-this.minZ)/dimMax;
    },

	// returns the matrix which centers the mesh and scales it
	// invoke AFTER updating AABB
	autocenteringMatrix: function(){
		var tr = translationMatrix(
		    -(this.minX+this.maxX)/2.0,
		    -(this.minY+this.maxY)/2.0,
		    -(this.minZ+this.maxZ)/2.0
		);
		var dimX = this.maxX-this.minX;
		var dimY = this.maxY-this.minY;
		var dimZ = this.maxZ-this.minZ;
		var dimMax = Math.max(dimZ, dimY, dimX);
		var sc = scalingMatrix(2.0/dimMax);

		return multMatrix(sc , tr);
	},

	makeSquare: function(r, g, b) {
		this.allocate(4, 2);

		this.setVert(0, 0, 0, 0);
        this.setVert(1, 1, 0, 0);
        this.setVert(2, 1, 0, 1);
        this.setVert(3, 0, 0, 1);

        /*this.setNorm(0, 0, 1, 0);
        this.setNorm(1, 0, 1, 0);
        this.setNorm(2, 0, 1, 0);
        this.setNorm(3, 0, 1, 0);*/

        /*this.setColor(0, r, g, b);
        this.setColor(1, r, g, b);
        this.setColor(2, r, g, b);
        this.setColor(3, r, g, b);*/
		for(var i = 0; i < 4; i++)
			this.setColor(i, r, g, b);

		this.setQuad(0, 3, 2, 1, 0);

		this.updateNormals();
	},

/*
	  6------7
	 /      /|
     4------5|
	| |    | |
	| |2---|-|3
	|/     |/
	0------1
*/
	makeCube: function() {
		this.allocate(8 , 12);
		this.setVert(0, 0, 0, 1);
		this.setVert(1, 1, 0, 1);
		this.setVert(2, 0, 0, 0);
		this.setVert(3, 1, 0, 0);
		this.setVert(4, 0, 1, 1);
		this.setVert(5, 1, 1, 1);
		this.setVert(6, 0, 1, 0);
		this.setVert(7, 1, 1, 0);

		/*this.setNorm(0, 0, 1, 0);
        this.setNorm(1, 0, 1, 0);
        this.setNorm(2, 0, 1, 0);
        this.setNorm(3, 0, 1, 0);
		this.setNorm(4, 0, 1, 0);
        this.setNorm(5, 0, 1, 0);
        this.setNorm(6, 0, 1, 0);
		this.setNorm(7, 0, 1, 0);*/

		//colore di prova
		/*this.setColor(0, 0.02, 0.09, 0.9);
        this.setColor(1, 0.02, 0.09, 0.9);
        this.setColor(2, 0.9, 0.2, 0.3);
        this.setColor(3, 0.02, 0.09, 0.9);
		this.setColor(4, 0.02, 0.09, 0.9);
        this.setColor(5, 0.02, 0.09, 0.9);
        this.setColor(6, 0.9, 0.2, 0.3);
        this.setColor(7, 0.9, 0.2, 0.3);*/
		//approccio in cui si da più di un colore ai vertici
		//front blu
		this.setColor(0, 0.1, 0.2, 0.8);
        this.setColor(1, 0.1, 0.2, 0.8);
		this.setColor(4, 0.1, 0.2, 0.8);
        this.setColor(5, 0.1, 0.2, 0.8);
		//right red
		this.setColor(1, 0.7, 0.2, 0.2);
		this.setColor(3, 0.7, 0.2, 0.2);
		this.setColor(5, 0.7, 0.2, 0.2);
		this.setColor(7, 0.7, 0.2, 0.2);
		//up yellow
		this.setColor(4, 0.9, 0.9, 0.1);
        this.setColor(5, 0.9, 0.9, 0.1);
        this.setColor(6, 0.9, 0.9, 0.1);
        this.setColor(7, 0.9, 0.9, 0.1);
		//left green
		this.setColor(0, 0.2, 0.7, 0.1);
        this.setColor(2, 0.2, 0.7, 0.1);
		this.setColor(4, 0.2, 0.7, 0.1);
        this.setColor(6, 0.2, 0.7, 0.1);
		//down violet
		this.setColor(0, 0.6, 0.1, 0.5);
        this.setColor(1, 0.6, 0.1, 0.5);
        this.setColor(2, 0.6, 0.1, 0.5);
        this.setColor(3, 0.6, 0.1, 0.5);
		//back orange
		this.setColor(2, 0.9, 0.5, 0.1);
        this.setColor(3, 0.9, 0.5, 0.1);
		this.setColor(6, 0.9, 0.5, 0.1);
        this.setColor(7, 0.9, 0.5, 0.1);

		this.setQuad(0, 0, 1, 5, 4);
		this.setQuad(2, 1, 3, 7, 5);
		this.setQuad(4, 4, 5, 7, 6);
		this.setQuad(6, 0, 2, 6, 4);
		this.setQuad(8, 0, 1, 3, 2);
		this.setQuad(10, 2, 3, 7, 6);

		this.updateNormals();
	},


	makeCone: function(res) {
		this.allocate(res*2, res*2);

		for(var i = 0; i < res; i++) {
			var a = 2 * Math.PI * i/res;
			var s = Math.sin(a);
			var c = Math.cos(a);
			this.setVert(i, c, -1, s);
			this.setVert(i + res, 0, +1, 0);
			const k = 1.0 / Math.sqrt(1.25);
			this.setNorm(i, c * k, 0.5 * k, s*k);
			this.setNorm(i+res, c*k, 0.5*k, s*k);

			//prova per il colore
			this.setColor(i, 0.09, 0.76, 0.09);
			this.setColor(i + res, 0.09, 0.76, 0.09);
		}

		for(var i = 0; i < res; i++) {
			var j = (i + 1) % res;
			this.setQuad(i*2, i, j, j + res, i + res);
		}
  },



	allocate: function(nverts, ntris) {
		this.verts = new Float32Array(nverts*9);
      	this.tris = new Uint16Array(ntris*3);
   	},

   	setTri: function(i, va, vb, vc) {
      	this.tris[i*3+0] = va;
      	this.tris[i*3+1] = vb;
      	this.tris[i*3+2] = vc;
   	},

   	setQuad: function(i, va, vb, vc, vd) {
      	this.setTri(i+0, va, vb, vd);
      	this.setTri(i+1, vb, vc, vd);
   	},

   	setVert: function(i, x, y, z) {
      	this.verts[i*9+0] = x;
      	this.verts[i*9+1] = y;
      	this.verts[i*9+2] = z;
   	},

   	setNorm: function(i, nx, ny, nz) {
      	this.verts[i*9+3] = nx;
      	this.verts[i*9+4] = ny;
      	this.verts[i*9+5] = nz;
   	},

	setColor: function(i, r, g, b ){
      	this.verts[i*9+6] = r;
      	this.verts[i*9+7] = g;
      	this.verts[i*9+8] = b;
   	},

};
