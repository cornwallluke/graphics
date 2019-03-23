// MultiJointModel.js (c) 2012 matsuda and itami
// Vertex shader program
/*var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  // Shading calculation to make the arm look three-dimensional
  '  vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7));\n' + // Light direction
  '  vec4 color = vec4(1.0, 0.4, 0.0, 1.0);\n' +  // Robot color
  '  vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a);\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';*/
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n' +
	'varying vec3 v_eyeDir;\n'+
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
  '  v_TexCoords = a_TexCoords;\n' +
	'  v_eyeDir = v_Position.xyz;\n'+
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
	'uniform bool u_DayTime;\n' + 
  'uniform bool u_UseTextures;\n' +    // Texture enable/disable flag
	'uniform bool u_UseNormals;\n' +    // Texture enable/disable flag
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
	'uniform vec3 u_eyePosition;\n'+
	'varying vec3 v_eyeDir;\n'+
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'uniform sampler2D u_Sampler;\n' +
	'uniform sampler2D u_nSampler;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
		// Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
	'  u_nSampler;u_UseNormals\n;u_nSampler;\nu_eyePosition;\n'+
	'  if (u_UseNormals){\n'+
	'   \n'+
  '  	normal = normalize(normalize((texture2D(u_nSampler,v_TexCoords).rgb - 0.5))+normal*4.0);\n' +
	'  }\n'+ 
	'  vec3 lightDirection = normalize(vec3(1, 1, 0.8));\n' + // Light direction
	'  u_LightPosition;\n'+
     // Calculate the light direction and make its length 1.
	'  if(!u_DayTime){\n'+
  '  	 lightDirection = normalize(u_LightPosition - v_Position);\n' +
	'  }\n'+
     // The dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(lightDirection, normal), 0.05);\n' +
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 diffuse;\n' +
  '  if (u_UseTextures) {\n' +
  '     vec4 TexColor = texture2D(u_Sampler, v_TexCoords);\n' +
  '     diffuse = u_LightColor * TexColor.rgb * nDotL * 1.6;\n' +
  '  } else {\n' +
  '     diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
  '  }\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  '}\n';
var meshes=[];
function main() {
	
	meshes.push(fetch('kingsgatebridge.json').then(function(response){ return response.json()}));
	var mesh1 = fetch('kgvt.json').then(function(response){ 
    return response.json()
	});
	var mesh2 = fetch('kgbuv.json').then(function(response){
		return response.json()
	});
	var mesh3 = fetch('boat.json').then(function(response){
		return response.json()
	});
	Promise.all([mesh1,mesh2,mesh3]).then(function(values){
		meshes=values
		// Retrieve <canvas> element
		var canvas = document.getElementById('webgl');
		
		//console.log(meshes);
		// Get the rendering context for WebGL
		var gl = getWebGLContext(canvas);
		if (!gl) {
			console.log('Failed to get the rendering context for WebGL');
			return;
		}

		// Initialize shaders
		if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
			console.log('Failed to intialize shaders.');
			return;
		}

		
		

		// Set the clear color and enable the depth test
		gl.clearColor(0.8, 0.8, 0.9, 1.0);
		gl.enable(gl.DEPTH_TEST);
		
		// Get the storage locations of uniform variables
		var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
		var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
		var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
		var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
		var u_dayTime = gl.getUniformLocation(gl.program, 'u_DayTime');
		var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
		var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
		var u_UseTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
		var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
		var u_nSampler = gl.getUniformLocation(gl.program, 'u_nSampler');
		var u_UseNormals = gl.getUniformLocation(gl.program, 'u_UseNormals');
		var u_eyePosition =  gl.getUniformLocation(gl.program, 'u_eyePosition');
		if (!u_eyePosition||!u_UseNormals||!u_nSampler||!u_UseNormals||!u_dayTime||!u_Sampler||!u_UseTextures||!u_ModelMatrix || !u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
			console.log('Failed to get the storage location');
			return;
		}
		gl.uniform1i(u_dayTime, timeofday);
		if(timeofday){
			gl.clearColor(0.8, 0.8, 0.9, 1.0);
		}else{
			gl.clearColor(0,0,0.1,1);
		}
		
		//var modelMatrix = new Matrix4();  // Model matrix
		//var mvpMatrix = new Matrix4();    // Model view projection matrix
		//var normalMatrix = new Matrix4(); // Transformation matrix for normals
		
		// Calculate the view projection matrix
		var viewProjMatrix = new Matrix4();
		viewProjMatrix.setPerspective(100.0, canvas.width / canvas.height, 1.0, 5000.0);
		viewProjMatrix.lookAt(300, 330, 200, 0.0, 0.0, 200.0, 0.0, 1, 0.0);
		
		var Cubetexture = gl.createTexture();   // Create a texture object
		if (!Cubetexture) {
			console.log('Failed to create the texture object');
			return false;
		}
		var Cubetexture2 = gl.createTexture();   // Create a texture object
		if (!Cubetexture2) {
			console.log('Failed to create the texture object');
			return false;
		}
		// Get the storage location of u_Sampler
		
		/*Cubetexture.image = new Image();  // Create the image object
		if (!Cubetexture.image) {
			console.log('Failed to create the image object');
			return false;
		}
		Cubetexture2.image = new Image();  // Create the image object
		if (!Cubetexture.image) {
			console.log('Failed to create the image object');
			return false;
		}
		var textures = [Cubetexture,Cubetexture2];*/
		var tbufs = [gl.TEXTURE0];
		// Register the event handler to be called on key press
		//Cubetexture.image.onload = function(){
		imageloader(['mcuvt.jpg', 'grasslol2.jpg','boatuv2.jpg','trunk.jpg','leaves.jpg','water.jpg','waternormal.jpg','bridgenormal.jpg'],function(texturesp){
			//Cubetexture2.image.onload = function(){
				console.log(texturesp);
				textures=[];
				for(t of texturesp){
					a=gl.createTexture();   // Create a texture object
					if (!a) {
						console.log('Failed to create the texture object');
						return false;
					}
					a.image=t;
					textures.push(a);
				}
				document.onkeydown = function(ev){ keydown(ev, gl, viewProjMatrix,meshes,meshes,textures); };
				for(var i=0;i<textures.length;i++){
					loadTex(gl, textures[i], u_Sampler, u_UseTextures,tbufs[0]);
				}
				loadTex(gl, textures[6], u_nSampler, u_UseTextures,gl.TEXTURE1);
				loadTex(gl, textures[7], u_nSampler, u_UseTextures,gl.TEXTURE1);
				draw(gl, viewProjMatrix,meshes,meshes,textures,textures); // Draw the robot arm
				
			//}
		});
		//Cubetexture.image.src = 'mcuvt.jpg';
		//Cubetexture2.image.src = 'grasslol2.jpg';
	});
}

function imageloader(filess, callback) {
  var imgs = [];
  var loaded = 0;
  var cb = function(){
			loaded=loaded+1;
			if (loaded==filess.length) {
				callback(imgs);
			}
		}  
 
  for (var i = 0; i < filess.length; i++) {
    var img = new Image();
		img.src=filess[i];
		img.onload = cb;
    imgs.push(img);
  }
}
var ANGLE_STEP = 3.0;     // The increments of rotation angle (degrees)
var g_bridgeAngle = 10.0;   // The rotation angle of arm1 (degrees)  
var g_bridgeMove = false; // The rotation angle of joint1 (degrees)
var g_boatPos = 0.0;  // The rotation angle of joint2 (degrees)
var g_showBoat = false;  // The rotation angle of joint3 (degrees)
var g_cameraHeight=400;
var g_fov=103;
var g_cameraAngle=230;
var timeofday=true;
var waterposition=0;
function keydown(ev, gl, viewProjMatrix,meshes,meshes,textures) {
	console.log(ev.keyCode);
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of joint1 around the z-axis
      g_cameraHeight = Math.min(g_cameraHeight+ANGLE_STEP*4,600)
      break;
    case 38: // Down arrow key -> the negative rotation of joint1 around the z-axis
      g_cameraHeight = Math.max(g_cameraHeight-ANGLE_STEP*4,20)
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_cameraAngle = (g_cameraAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_cameraAngle = (g_cameraAngle - ANGLE_STEP) % 360;
      break;
    case 82: // 'r'key -> reset the bridge construction
      g_bridgeAngle=10;
			g_bridgeMove=false;
      break; 
    case 83: // 's'key -> start the bridge construction
      g_bridgeMove=true;
      break;
    case 66: // 'b'key -> spawn boat to sail up river
      g_showBoat=true;
      break;
		case 73: // 'i'key -> increase fov
      g_fov=Math.min(g_fov+ANGLE_STEP*2,110);
      break;
		case 75: // 'k'key -> decrease fov
      g_fov=Math.max(g_fov-ANGLE_STEP*2,16);
      break;
		case 68: // 'd'key -> make it daytime
			var u_dayTime = gl.getUniformLocation(gl.program, 'u_DayTime');
			if(!u_dayTime){
				console.log('yeet');
				return;
			}
			console.log(timeofday);
			timeofday=!timeofday;
      gl.uniform1i(u_dayTime, timeofday);
			if(timeofday){
			gl.clearColor(0.8, 0.8, 0.9, 1.0);
		}else{
			gl.clearColor(0,0,0.1,1);
		}
      break;
    default: return; // Skip drawing at no effective action
  }
  // Draw the robot arm
  //draw(gl, n, viewProjMatrix,u_MvpMatrix, u_NormalMatrix,meshes,u_ModelMatrix,meshes,textures,u_Sampler);
}
function initVertexBuffersFromFile(gl,meshes) {
	//console.log(meshes);
  // Coordinates（Cube which length of one side is 1 with the origin on the center of the bottom)
  var vertices = new Float32Array(meshes.vertices);

  // Normal
  var normals = new Float32Array(meshes.normals);
	var list=[];
	for(var i=0;i<meshes.normals.length/3;i++){
		list.push(1);
		list.push(1);
		list.push(1);
	}
	var colors = new Float32Array(list);
	
	var texCoords = new Float32Array(meshes.texturecoords[0]);
  // Indices of the vertices
  var indices = new Uint16Array(meshes.faces.flat());

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;


  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}
function initPlaneBuffers(gl){
	// Create a plane
  //    v2----- v3
  //   /       / 
  //  v1------v0

  // Coordinates
  var vertices = new Float32Array([
    2.0, 2.0, 2.0,  -2.0, 2.0, 2.0,  -2.0,-2.0, 2.0,   2.0,-2.0, 2.0		
  ]);

  // Colors
  var colors = new Float32Array([
    1,1,1,
		1,1,1,
		1,1,1,
		1,1,1,
 ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0
  ]);

  // Texture Coordinates
  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0
  ]);

  // Indices of the vertices
  var indices = new Uint16Array([
    0,1,2,0,2,3
 ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;


  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}
function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // Coordinates
  var vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v1-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v1 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v1 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ]);

  // Colors
  var colors = new Float32Array([
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
 ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Texture Coordinates
  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint16Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;


  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}
var windx=0;
var windy=0;
function initArrayBuffer(gl, attribute, data, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
  // Element size
  var FSIZE = data.BYTES_PER_ELEMENT;

  // Assign the buffer object to the attribute variable

  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, FSIZE * num, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}
// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();
var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function animateStep(){
	if(g_bridgeMove){
			if(g_bridgeAngle<90){
				g_bridgeAngle+=1;
			}
	}
	if(g_showBoat){
		g_boatPos+=3;
	}
	if(g_boatPos>=200){
		g_showBoat=false;
		g_boatPos=0;
	}
	waterposition=(waterposition+5)%600
}
function draw(gl, viewProjMatrix,meshes,meshes,textures) {
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
	var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
	var u_dayTime = gl.getUniformLocation(gl.program, 'u_DayTime');
	var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
	var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
	var u_UseTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
	var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
	var u_nSampler = gl.getUniformLocation(gl.program, 'u_nSampler');
	var u_UseNormals = gl.getUniformLocation(gl.program, 'u_UseNormals');
	var u_eyePosition = gl.getUniformLocation(gl.program, 'u_eyePosition');
	if (!u_eyePosition||!u_UseNormals||!u_nSampler||!u_UseNormals||!u_dayTime||!u_Sampler||!u_UseTextures||!u_ModelMatrix || !u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
		console.log('Failed to get the storage location');
		return;
	}
	var viewProjMatrix = new Matrix4();
	
	var canvas = document.getElementById('webgl');
	if(timeofday){
		gl.uniform3f(u_AmbientLight, 0.1, 0.1, 0.1);
	}	
	viewProjMatrix.setPerspective(g_fov, canvas.width / canvas.height, 1.0, 6000.0);
	
	viewProjMatrix.lookAt(300/g_fov*100, g_cameraHeight/g_fov*100, 300/g_fov*100, 0.0, 0, 0,0, 1, 0.0);
	viewProjMatrix.rotate(g_cameraAngle,0,1,0);
	viewProjMatrix.translate(0,0,-300);
	gl.uniform3f(u_eyePosition, 300/g_fov*100, g_cameraHeight/g_fov*100, 300/g_fov*100);
	//console.log(textures);
  // Clear color and depth buffer
	
	var drawl= function(){
		animateStep();
		draw(gl, viewProjMatrix,meshes,meshes,textures) 
	}
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var n = initVertexBuffersFromFile(gl,meshes[1].meshes[0]);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}
  //viewProjMatrix.lookAt(8.0, 4, 12.0, 0.0, 0.0, 0.0, 0.0, 1, 0.0);
  // Draw a base
	gl.uniform1i(u_UseNormals,true);
	setNormalTexture(gl,textures[7]);
	  g_modelMatrix.setTranslate(0.0, 0,60.0);
	pushMatrix(g_modelMatrix)
  g_modelMatrix.rotate(g_bridgeAngle,0,1,0);
	//setTex(gl,u_Sampler,0);
  drawBox(gl, n, 10.0, 10, 10.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,textures,u_Sampler,0);
	
	g_modelMatrix=popMatrix()
	g_modelMatrix.translate(0.0, 0, 517.0);
	g_modelMatrix.rotate(g_bridgeAngle,0,1,0);
	
	//setTex(gl,u_Sampler,1);
  drawBox(gl, n, 10.0, 10, 10.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,textures,u_Sampler,0);
	gl.uniform1i(u_UseNormals,false);
	//setNormalTexture(gl,textures[6]);
	
	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var n = initVertexBuffersFromFile(gl,meshes[0].meshes[0]);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}
  //viewProjMatrix.lookAt(8.0, 4, 12.0, 0.0, 0.0, 0.0, 0.0, 1, 0.0);
  // Draw a base
  g_modelMatrix.setTranslate(0.0, 0, -200.0);
	g_modelMatrix.rotate(90,0,1,0);
	drawBox(gl, n, 10.0, 10, 10.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,textures,u_Sampler,1);
	
	if(g_showBoat){
		var n = initVertexBuffersFromFile(gl,meshes[2].meshes[0]);
		if (n < 0) {
			console.log('Failed to set the vertex information');
			return;
		}
		if(!timeofday){
			gl.uniform3f(u_LightColor, Math.cos(g_boatPos/8)/4+0.75, Math.cos(g_boatPos/8+2)/4+0.75, Math.cos(g_boatPos/8+1)/4+0.75);
		}else{
			gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
		}
		gl.uniform3f(u_LightPosition,(g_boatPos-100)*5, 0, Math.cos(g_boatPos/20)*10+250);
		
		
		g_modelMatrix.setTranslate((g_boatPos-100)*5, -205, Math.cos(g_boatPos/20)*10+250);
		
		g_modelMatrix.scale(1.4,1.4,1.4);
		g_modelMatrix.rotate(90,0,1,0);
		g_modelMatrix.rotate(Math.sin(g_boatPos/20)*5,0,1,0);
		g_modelMatrix.rotate(Math.sin(g_boatPos/20)*3,1,0,0);
		g_modelMatrix.rotate(Math.sin(g_boatPos/15)*8,0,0,1);
		//setTex(gl,u_Sampler,1);
		drawBox(gl, n, 10.0, 10, 10.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,textures,u_Sampler,2);
	}else{
		gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
		// Set the light direction (in the world coordinate)
		gl.uniform3f(u_LightPosition, 100, -200, 350);
		// Set the ambient light
		gl.uniform3f(u_AmbientLight, 0.1, 0.1, 0.1);
	}
	
	var n = initVertexBuffers(gl);
		if (n < 0) {
			console.log('Failed to set the vertex information');
			return;
	}
	g_seed=10;
	windx+=Math.random()*0.1
	windy+=Math.random()*0.13
	var wind = new Matrix4();
	wind.elements=new Float32Array(
		[1,0,0,0
		,Math.sin(windx)*.2,1,Math.sin(windy)*.2,0
		,0,0,1,0
		,0,0,0,1]);
	for(var locations of treelocations){
		
		g_modelMatrix.setTranslate(locations[0],locations[1],locations[2]);
		g_modelMatrix.multiply(wind);
		//console.log(g_modelMatrix);
		//console.log(a.multiply(g_modelMatrix));
		//console.log(a);
		g_modelMatrix.scale(locations[3],locations[3],locations[3]);
		drawTree(gl, n,viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,u_Sampler,textures[3],textures[4],2);
	}
	gl.uniform1i(u_UseNormals,true);
	setNormalTexture(gl,textures[6]);
	var n = initPlaneBuffers(gl);
		if (n < 0) {
			console.log('Failed to set the vertex information');
			return;
	}
	g_modelMatrix.setTranslate(waterposition-3000,-230,320);
	g_modelMatrix.rotate(-90,1,0,0);
	for(var i=0;i<10;i++){
		
		drawBox(gl, n, 150.0, 150, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,textures,u_Sampler,5);
		g_modelMatrix.translate(600,0,0);
	}
	
	gl.uniform1i(u_UseNormals,false);
	requestAnimationFrame(drawl);
	
}
var treelocations=[[-130,-210,-80,3],[-430,-170,680,4],[230,-40,980,4],[180,93,1200,4],[500,-10,-280,3]];



function setNormalTexture(gl,texture){
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,texture);
}



//x, y, z, 
function drawTree(gl, n,viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,u_Sampler,trunk,leaves,depth){
	//g_modelMatrix.setTranslate(x,y,z);
	var branchheight=reprandom()*5+4
	g_modelMatrix.translate(0,branchheight,0);
	drawBox(gl, n, 1, branchheight, 1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,[trunk],u_Sampler,0);
	g_modelMatrix.translate(0,branchheight,0);
	if(depth==0||reprandom()<0.4){
			drawBox(gl, n, 3.0+reprandom()*2, 3+reprandom()*2, 3.0+reprandom()*2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,[leaves],u_Sampler,0);
	}else{
		for(var i=0;i<3;i++){
			pushMatrix(g_modelMatrix)
			g_modelMatrix.rotate(reprandom()*160-80,reprandom()*2-1,reprandom()*2-1,reprandom()*2-1);
			drawTree(gl, n,viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,u_Sampler,trunk,leaves,depth-1);
			g_modelMatrix=popMatrix()
		}
	}
	
	
}

var g_seed=0;
function reprandom(){
	g_seed=(g_seed*9301+49297)%233208;
	return g_seed/233208;
}
var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

// Draw rectangular solid
function drawBox(gl, n, width, height, depth, viewProjMatrix, u_MvpMatrix, u_NormalMatrix,u_ModelMatrix,textures,u_Sampler,i) {
  pushMatrix(g_modelMatrix);   // Save the model matrix
    // Scale a cube and draw
    g_modelMatrix.scale(width, height, depth);
		gl.uniformMatrix4fv(u_ModelMatrix, false, g_modelMatrix.elements);
    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
		
		//loadTex(gl, n, texture, u_Sampler, u_UseTextures);
    // Draw
		gl.activeTexture(gl.TEXTURE0);

  // Bind the texture object to the target
		gl.bindTexture(gl.TEXTURE_2D, textures[i]);
		//setTex(gl,u_Sampler,i);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  g_modelMatrix = popMatrix();   // Retrieve the model matrix
}
function setTex(gl,u_Sampler,i){
	gl.activeTexture(gl.TEXTURE0+i);
	gl.uniform1i(u_Sampler, i);
}
function loadTex(gl, texture, Sampler, u_UseTextures,tbuf) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

  // Enable texture unit0
  gl.activeTexture(tbuf);

  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Assign u_Sampler to TEXTURE0
  gl.uniform1i(Sampler, tbuf-gl.TEXTURE0);

  // Enable texture mapping
  gl.uniform1i(u_UseTextures, true);

  // Draw the textured cube
  //gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}