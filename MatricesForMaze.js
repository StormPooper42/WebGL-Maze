/*
   matrices.js:
   function to handle matrices
   Courtesy of Marco Tarini, Università dell'Insubria
*/

/* ALL MATRICES ARE IN COLUMN-MAJOR FORMAT  */
/* ALL ANGLES ARE IN DEGREES                */

function identityMatrix() {
	return [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1
	];
}

///////////////////////////////////////////////////////////////////////
// Added stuff for maze_editor

function Creatematrix(N) {
    var result = [];
    for (var i=0;i<N+1;++i)
        result.push(new Array(N+1).fill([0,0]));
    return result;
}

function SetWalls(A){
    var N=A[0].length;
    for (var j=0;j<N;++j)
        if (j==0 || j==N-1){
            A[0][j]=[1,1];
            A[N-1][j]=[1,1];
        }else{
            A[0][j]=[1,0];
            A[N-1][j]=[1,0];
            A[j][N-1]=[0,1];
            A[j][0]=[0,1];
        }
    return A;
}

function VerticalSegment(x1,y1,x2,y2,data_structure)
{
    var column=x1;
    var segment_length=Math.abs(y1-y2);
    var starting_row_index=N-Math.max(y1,y2);
    for (var h=0;h<segment_length;++h)
    {
        data_structure[starting_row_index+h][column]=[data_structure[starting_row_index+h][column][0],1];
    }
    return data_structure;
}

function HorizontalSegment(x1,y1,x2,y2,data_structure)
{
    var row=N-y1;
    var segment_length=Math.abs(x2-x1);
    var starting_column_index=Math.min(x1,x2);
    for (var h=0;h<segment_length;++h)
    {
        data_structure[row][starting_column_index+h]=[1,data_structure[row][starting_column_index+h][1]];
    }
    return data_structure;
}

function CreatesCoordinates(A)
{
    var N=A[0].length-1;
    var coord=[];
    for (var i=1;i<N;++i) {
        var HWallsLoc=SetDataStructure(A[i],0);
        var v=getCol(A,i);
        var VWallsLoc=SetDataStructure(v,1);
        if(HWallsLoc.length!=0){
            var n = HWallsLoc.length;
            for (var j=0;j<n;j+=2)
                coord.push(HWallsLoc[j],N-i,HWallsLoc[j]-HWallsLoc[j+1],N-i);
        }
        if(VWallsLoc.length!=0){
            var m=VWallsLoc.length;
            for (var h=0;h<m;h+=2)
                coord.push(i,N-VWallsLoc[h],i,N-VWallsLoc[h]+VWallsLoc[h+1])
        }
    }
    return coord;
}

function SetDataStructure(A,mode)
{
    var count_h=0;
    var loc_h=[];
    var data=[];
    var lungh=-1;
    var lungh_h=[];
    var N=A.length;
    if (mode==0) {
        for (var i=0;i<N;++i)
            if(A[i][0]==1) loc_h.push(i);
    } else {
        for (var i=0;i<N;++i)
            if(A[i][1]==1) loc_h.push(i);
    }
    for (var j=0;j<loc_h.length;++j) {
        if(loc_h[j+1]==loc_h[j]+1) {
            --lungh;
            ++count_h;
        } else if(count_h==0) {
            data.push(loc_h[j]);
            data.push(lungh);
        } else {
            data.push(loc_h[j+lungh+1]);
            data.push(lungh);
            lungh=-1;
            count_h=0;
        }
    }
    return data;

}
function CreateRoomsCoord(room)
{
    var rooms_coord=[];
    for (var i=0;i<room.length-1;i+=2) {
            rooms_coord.push(room[i]-epsilon);
            rooms_coord.push(room[i+1]-epsilon);
            rooms_coord.push(room[i]+epsilon);
            rooms_coord.push(room[i+1]-epsilon);
            rooms_coord.push(room[i]);
            rooms_coord.push(room[i+1]+epsilon);
    }
    return rooms_coord;
}

function GetMazeObject()
{
    var Maze2D=JSON.parse(localStorage.getItem('Maze2D'));
    var HWallsLoc=[];
    var VWallsLoc=[];
    var N=Maze2D.WallsMatrix[0].length-1;
    for (var i=0;i<=N;++i)
    {
        var v= SetDataStructure(Maze2D.WallsMatrix[i],0);
        HWallsLoc[i]=v;
        var col=getCol(Maze2D.WallsMatrix,i);
        var w=SetDataStructure(col,1);
        VWallsLoc[i]=w;
    }
    var Maze={
            SizeOfTheMaze: N,
            HorizontalWallsLoc: HWallsLoc,
            VerticalWallsLoc: VWallsLoc,
            Rooms: Maze2D.Rooms,
        };
    return Maze;
}

function getCol(matrix, col)
{
   var column = [];
   for(var i=0; i<matrix.length; i++)
        column.push(matrix[i][col]);
        return column;
}

function DrawCircle(x,y)
{
    points=[];
    center = [x, y];
    points.push(center);
    for (i = 0; i <= 100; i++){
        points.push(center + [
        r*Math.cos(2*Math.PI/200),
        r*Math.sin(2*Math.PI/200)
        ]);
    }
}

function dist(x1,y1,x2,y2){
    var d=Math.sqrt(Math.pow((x2-x1),2)+Math.pow((y2-y1),2));
    return d;
}

////////////////////////////////////////////////////////////////
// Matrix stuff
function rotationXMatrix( deg ){
	var s = Math.sin( deg * 3.1415 / 180);
	var c = Math.cos( deg * 3.1415 / 180);
	return res = [
	   1 ,0 ,0 ,0,
	   0 ,c ,s ,0,
	   0 ,-s,c ,0,
	   0 ,0, 0 ,1
	];
}

function rotationYMatrix( deg ){
	var s = Math.sin( deg * 3.1415 / 180);
	var c = Math.cos( deg * 3.1415 / 180);
	return res = [
	   c ,0 ,-s,0,
	   0 ,1 ,0 ,0,
	   s ,0, c ,0,
	   0 ,0, 0 ,1
	];
}

function rotationZMatrix( deg ){
	var s = Math.sin( deg * 3.1415 / 180);
	var c = Math.cos( deg * 3.1415 / 180);
	return res = [
	   c ,s ,0 ,0,
	   -s,c ,0 ,0,
	   0 ,0, 1 ,0,
	   0 ,0, 0 ,1
	];
}

function translationMatrix( dx, dy, dz ){
	return [
	   1 ,0 ,0 ,0,
	   0 ,1 ,0 ,0,
	   0 ,0 ,1 ,0,
	   dx,dy,dz,1
	];
}

function scalingMatrix( sx, sy, sz ){
    if (typeof sy == 'undefined' ) sy = sx;
    if (typeof sz == 'undefined' ) sz = sx;
	return [
	   sx,0 ,0 ,0,
	   0 ,sy,0 ,0,
	   0 ,0 ,sz,0,
	   0 ,0 ,0 ,1
	];
}

function perspectiveMatrix( focal, aspect, near, far ){
	return [
	   focal ,0           ,0 ,                     0,
	   0     ,focal*aspect,0 ,                     0,
	   0     ,0           ,(far+near)/(near-far) ,-1,
	   0     ,0           ,2*far*near/(near-far) , 0
	];
}

function perspectiveMatrixFOV( fov, aspect, near, far ){
    var focal = 1.0/Math.tan(fov * 3.1415 / 360);
	return [
	   focal/aspect,   0,     0,                      0,
	   0           ,   focal, 0,                      0,
	   0           ,   0,     (far+near)/(near-far), -1,
	   0           ,   0,     2*far*near/(near-far),  0
	];
}

function multMatrix( a, b ) {
	/* product row by column */
	var res = [];
	for (var i=0; i<4; i++)    // column
	for (var j=0; j<4; j++) {  // row
		res[i*4+j] = 0;
		for (var k=0; k<4; k++)
			res[i*4+j] += a[k*4+j] * b[i*4+k];
	}
	return res;
}

function multMatrixVec( a, v ) {
    var res = [];
    for (var j=0; j<4; j++) {  // row
        res[j]=0;
        for (var k=0;k<4;k++)
            res[j] += a[k*4+j]*v[k];
    }
    return res;
}

function normVec(v) {
    var n = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
    return [v[0]/n,v[1]/n,v[2]/n,0]
}

function normVec2D( v ) {
    var n = Math.sqrt(v[0]*v[0]+v[1]*v[1]);
    return [v[0]/n,v[1]/n]
}

function transposeMatrix3(m) {
    return [m[0], m[3], m[6],
            m[1], m[4], m[7],
            m[2], m[5], m[7]];
}

function transposeMatrix4(m) {
    return [m[0], m[4], m[ 8], m[12],
            m[1], m[5], m[ 9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15]];
}


function detMatrix3(m) {
    return  m[0]*(m[4]*m[8]-m[5]*m[7]) -
            m[1]*(m[3]*m[8]-m[5]*m[6]) +
            m[2]*(m[3]*m[7]-m[4]*m[6]);
}

function invMatrix3(m) {
    var det = detMatrix3(m);
    if (det == 0) return [0,0,0,0,0,0,0,0,0];
    var A = m[4]*m[8]-m[7]*m[5];
    var B = m[7]*m[2]-m[1]*m[8];
    var C = m[5]*m[1]-m[4]*m[2];
    var D = m[6]*m[5]-m[3]*m[8];
    var E = m[0]*m[8]-m[6]*m[2];
    var F = m[3]*m[2]-m[0]*m[5];
    var G = m[3]*m[7]-m[6]*m[4];
    var H = m[6]*m[1]-m[0]*m[7];
    var I = m[4]*m[0]-m[3]*m[1];
    return [A/det, B/det, C/det,
            D/det, E/det, F/det,
            G/det, H/det, I/det];
}

function invMatrix4(m) {
    var a = [m[0], m[1], m[2],
             m[4], m[5], m[6],
             m[8], m[9], m[10]];
    var b = [m[12], m[13], m[14]];
    a = invMatrix3(a);
    var c = [-a[0]*b[0]-a[3]*b[1]-a[6]*b[2],
             -a[1]*b[0]-a[4]*b[1]-a[7]*b[2],
             -a[2]*b[0]-a[5]*b[1]-a[8]*b[2]];
    return [a[0], a[1], a[2], 0,
            a[3], a[4], a[5], 0,
            a[6], a[7], a[8], 0,
            c[0], c[1], c[2], 1];
}

//additional functions
function multScalarVector(s, v) {
	var result = [];
	for(var i = 0; i < v.length; i++)
		result[i] = v[i] * s;
	return result;
}

function subVectors(v0, v1) {
	var result = [];
	for (var i = 0; i < 3; i++)
		result[i] = v0[i] - v1[i];
	return result;
}

function crossProduct(v0, v1) {
	return [v0[1]*v1[2] - v0[2]*v1[1],
          	v0[2]*v1[0] - v0[0]*v1[2],
          	v0[0]*v1[1] - v0[1]*v1[0]];
}

function normalizeVector(v) {
	if(magnitudeVector(v) == 0)
		return [0, 0, 0];
	return [v[0]/magnitudeVector(v), v[1]/magnitudeVector(v), v[2]/magnitudeVector(v)];
}

function magnitudeVector(v) {
	var magnitude = 0;
	for(var i = 0; i < v.length; i++)
		magnitude += Math.pow(v[i], 2);
	if(magnitude == 0)
		return magnitude;
	return Math.sqrt(magnitude);
}

function sumVectors(v1, v2, v3) {
	if(v3 == null)
		return [v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2]]
	return [v1[0]+v2[0]+v3[0], v1[1]+v2[1]+v3[1], v1[2]+v2[2]+v3[2]]
}

function dotProduct(v1, v2) {
	var dotprod = 0;
	for(var i = 0; i < 3; i++)
		dotprod += v1[i] * v2[i];
	return dotprod;
}

//quaternion functions
function identityQuat() {
	return [[0, 0, 0], 1];
}

function axisAngle2Quat(axis, angle) {
	var	w = Math.cos(angle/2),
		sin = Math.sin(angle/2);

	return [[axis[0]*sin, axis[1]*sin, axis[2]*sin], w];
}

function multQuat(q1, q2) {
	//qn[0] = vn, qn[1] = wn
	return [sumVectors(multScalarVector(q2[1],q1[0]),
					  multScalarVector(q1[1], q2[0]),
					  crossProduct(q1[0], q2[0])),
		  	q1[1]*q2[1]-dotProduct(q1[0], q2[0])];
}

function quat2Matrix(q) {
	var x = q[0][0],
		y = q[0][1],
		z = q[0][2],
		w = q[1];

	//adding a column and a row because we always deal with 4x4 matrices
	return [
		1-2*Math.pow(y, 2)-2*Math.pow(z, 2), 2*x*y-2*w*z, 2*x*z+2*w*y, 0,
		2*x*y+2*w*z, 1-2*Math.pow(x, 2)-2*Math.pow(z, 2), 2*z*y-2*w*x, 0,
		2*x*z-2*w*y, 2*y*z+w*x, 1-2*Math.pow(x, 2)-2*Math.pow(y, 2), 0,
		0, 0, 0, 1
	]
}

function magnitudeQuat(q) {
	var x = q[0][0],
		y = q[0][1],
		z = q[0][2],
		w = q[1];

	return Math.sqrt(Math.pow(w, 2) + Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2))
}

function normQuat(q) {
	return q/magnitudeQuat(q);
}
