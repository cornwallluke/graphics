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
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
  '  v_TexCoords = a_TexCoords;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform bool u_UseTextures;\n' +    // Texture enable/disable flag
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make its length 1.
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
     // The dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 diffuse;\n' +
  '  if (u_UseTextures) {\n' +
  '     vec4 TexColor = texture2D(u_Sampler, v_TexCoords);\n' +
  '     diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;\n' +
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
	var combinedData = {"mesh1":{},"mesh2":{}};
	Promise.all([mesh1,mesh2]).then(function(values){
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

		// Set the vertex information
		var n = initVertexBuffersFromFile(gl,meshes[0].meshes[0]);
		if (n < 0) {
			console.log('Failed to set the vertex information');
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
		var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
		var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
		if (!u_ModelMatrix || !u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
			console.log('Failed to get the storage location');
			return;
		}

		var u_UseTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
		if (!u_UseTextures) { 
			console.log('Failed to get the storage location for texture map enable flag');
			return;
		}
		// Set the light color (white)
		gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
		// Set the light direction (in the world coordinate)
		gl.uniform3f(u_LightPosition, 40, 40, 40);
		// Set the ambient light
		gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

		//var modelMatrix = new Matrix4();  // Model matrix
		//var mvpMatrix = new Matrix4();    // Model view projection matrix
		//var normalMatrix = new Matrix4(); // Transformation matrix for normals
		
		// Calculate the view projection matrix
		var viewProjMatrix = new Matrix4();
		viewProjMatrix.setPerspective(100.0, canvas.width / canvas.height, 1.0, 5000.0);
		viewProjMatrix.lookAt(380, 380, 420, 0.0, 0.0, 0.0, 0.0, 1, 0.0);
		
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
		var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
		if (!u_Sampler) {
			console.log('Failed to get the storage location of u_Sampler');
			return false;
		}

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
		var tbufs = [gl.TEXTURE0,gl.TEXTURE1];
		// Register the event handler to be called on key press
		//Cubetexture.image.onload = function(){
		imageloader(['mcuvt.jpg', 'grasslol2.jpg'],function(texturesp){
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
				document.onkeydown = function(ev){ keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix,meshes,u_ModelMatrix,meshes,textures,u_Sampler); };
				loadTex(gl, n, textures[0], u_Sampler, u_UseTextures,tbufs[0]);
				loadTex(gl, n, textures[1], u_Sampler, u_UseTextures,tbufs[1]);
				draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix,meshes,u_ModelMatrix,meshes,textures,u_Sampler,u_UseTextures,textures,u_Sampler); // Draw the robot arm
				
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
var g_arm1Angle = 90.0;   // The rotation angle of arm1 (degrees)  
var g_joint1Angle = 45.0; // The rotation angle of joint1 (degrees)
var g_joint2Angle = 0.0;  // The rotation angle of joint2 (degrees)
var g_joint3Angle = 0.0;  // The rotation angle of joint3 (degrees)

function keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix,meshes,u_ModelMatrix,meshes,textures,u_Sampler) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of joint1 around the z-axis
      if (g_joint1Angle < 135.0) g_joint1Angle += ANGLE_STEP;
      break;
    case 38: // Down arrow key -> the negative rotation of joint1 around the z-axis
      if (g_joint1Angle > -135.0) g_joint1Angle -= ANGLE_STEP;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
      break;
    case 90: // 'ｚ'key -> the positive rotation of joint2
      g_joint2Angle = (g_joint2Angle + ANGLE_STEP) % 360;
      break; 
    case 88: // 'x'key -> the negative rotation of joint2
      g_joint2Angle = (g_joint2Angle - ANGLE_STEP) % 360;
      break;
    case 86: // 'v'key -> the positive rotation of joint3
      if (g_joint3Angle < 60.0)  g_joint3Angle = (g_joint3Angle + ANGLE_STEP) % 360;
      break;
    case 67: // 'c'key -> the nagative rotation of joint3
      if (g_joint3Angle > -60.0) g_joint3Angle = (g_joint3Angle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }
  // Draw the robot arm
  draw(gl, n, viewProjMatrix,u_MvpMatrix, u_NormalMatrix,meshes,u_ModelMatrix,meshes,textures,u_Sampler);
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

function initVertexBuffers(gl) {
  // Coordinates（Cube which length of one side is 1 with the origin on the center of the bottom)
  var vertices = new Float32Array([
    0.5, 1.0, 0.5, -0.5, 1, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
    0.5, 1.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 1.0,-0.5, // v0-v3-v4-v5 right
    0.5, 1.0, 0.5,  0.5, 1.0,-0.5, -0.5, 1.0,-0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
   -0.5, 1.0, 0.5, -0.5, 1.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
   -0.5, 0.0,-0.5,  0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
    0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 1.0,-0.5,  0.5, 1.0,-0.5  // v4-v7-v6-v5 back
  ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
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

  // Write the vertex property to buffers (coordinates and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

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

function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix,meshes,u_ModelMatrix,meshes,textures,u_Sampler) {
	//console.log(textures);
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var n = initVertexBuffersFromFile(gl,meshes[1].meshes[0]);
			if (n < 0) {
				console.log('Failed to set the vertex information');
				return;
		}
  //viewProjMatrix.lookAt(8.0, 4, 12.0, 0.0, 0.0, 0.0, 0.0, 1, 0.0);
  // Draw a base
  var baseHeight = 2.0;
  g_modelMatrix.setTranslate(0.0, 12.0, 0.0);
	g_modelMatrix.rotate(-g_arm1Angle,g_joint3Angle,1,0);
	//setTex(gl,u_Sampler,0);
  drawBox(gl, n, 10.0, 10, 10.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,textures,u_Sampler,0);
	
	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var n = initVertexBuffersFromFile(gl,meshes[0].meshes[0]);
			if (n < 0) {
				console.log('Failed to set the vertex information');
				return;
		}
  //viewProjMatrix.lookAt(8.0, 4, 12.0, 0.0, 0.0, 0.0, 0.0, 1, 0.0);
  // Draw a base
  var baseHeight = 2.0;
  g_modelMatrix.setTranslate(0.0, -12.0, 0.0);
	g_modelMatrix.rotate(g_arm1Angle,g_joint3Angle,1,0);
	//setTex(gl,u_Sampler,1);
  drawBox(gl, n, 10.0, 10, 10.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, u_ModelMatrix,textures,u_Sampler,1);
	
 
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
function loadTex(gl, n, texture, u_Sampler, u_UseTextures,tbuf) {
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
  //gl.uniform1i(u_Sampler, 0);

  // Enable texture mapping
  gl.uniform1i(u_UseTextures, true);

  // Draw the textured cube
  //gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}