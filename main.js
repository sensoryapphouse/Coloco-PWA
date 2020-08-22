window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
    camStart();
}

// Override the function with all the posibilities
// navigator.getUserMedia ||
//     (navigator.getUserMedia = navigator.mozGetUserMedia ||
//     navigator.webkitGetUserMedia || navigator.msGetUserMedia);
var audioInput = null,
    realAudioInput = null,
    inputPoint = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;

var canvas;
var canvas2;
var Param1 = 0.0;
var Param2 = 0.0;
var Param3 = 0.0;
var btnContext;
var index = 0;
var screenState = 0;
var splash;
var gobutton;
var smartphoneIcon;
var button = [];
var kbutton = [];
var sbutton = [];
var lbutton = [];
var touches = [];
var colocoSettings = [0,1,2, 1,2,3, 2,2,2, 3,1,2, 4,1,2, 1,1,2];
var btnBack;
var fun;
var doingFun = 0;
var fun1;
var fun2;
var fun3;
var settings;
var aspect;
var nAgt = navigator.userAgent;
var mouseX = 0.5;
var mouseY = 0.5;
var scale;
var update = 0;

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
      if (k.nodeType == 3) {
        str += k.textContent;
      }
      k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "f") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "v") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
      return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

var programsArray = new Array();
var current_program;

function initShaders() {
  programsArray.push(createProgram("shader-vs", "shader-1-fs"));
  current_program = programsArray[0];
}

function createProgram(vertexShaderId, fragmentShaderId) {
  var shaderProgram;
  var fragmentShader = getShader(gl, fragmentShaderId);
  var vertexShader = getShader(gl, vertexShaderId);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.resolutionUniform = gl.getUniformLocation(shaderProgram, "resolution");
  shaderProgram.mouse = gl.getUniformLocation(shaderProgram, "mouse");
  shaderProgram.mouse1 = gl.getUniformLocation(shaderProgram, "mouse1");
  shaderProgram.indexUniform = gl.getUniformLocation(shaderProgram, "index");
  shaderProgram.time = gl.getUniformLocation(shaderProgram, "time");
  shaderProgram.Param1 = gl.getUniformLocation(shaderProgram, "Param1");
  shaderProgram.Param2 = gl.getUniformLocation(shaderProgram, "Param2");
  shaderProgram.Param3 = gl.getUniformLocation(shaderProgram, "Param3");
  return shaderProgram;
}

var webcam;
var texture;

function initTexture() {
  texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

var ix = 0.0;
var end;
var st = new Date().getTime();
function setUniforms() {
  end = new Date().getTime();
  gl.uniformMatrix4fv(current_program.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(current_program.mvMatrixUniform, false, mvMatrix);
  gl.uniform2f(current_program.resolutionUniform, canvas2.width, canvas2.height);
  gl.uniform2f(current_program.mouse, mouseX, mouseY);
  // gl.uniform2f(current_program.mouse1, mouseX1, mouseY1);
  // gl.uniform1i(current_program.indexUniform, ix);
  gl.uniform1f(current_program.time, ((end-st) % 1000000)/1000.0);
  gl.uniform1f(current_program.Param1, Param1);
  gl.uniform1f(current_program.Param2, Param2);
  gl.uniform1f(current_program.Param3, Param3);
}

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
function initBuffers() {
  cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  vertices = [-1.0, -1.0, 1.0, -1.0, 1.0,  1.0, -1.0,  1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 2;
  cubeVertexPositionBuffer.numItems = 4;

  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  var textureCoords = [0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0 ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  cubeVertexTextureCoordBuffer.itemSize = 2;
  cubeVertexTextureCoordBuffer.numItems = 4;

  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  var cubeVertexIndices = [0, 1, 2,      0, 2, 3];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 6;
}

function drawScene() {
  gl.viewport(0, 0, canvas2.width, canvas2.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.enable(gl.BLEND);

  mat4.ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0, pMatrix);

  gl.useProgram(current_program);
  mat4.identity(mvMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(current_program.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(current_program.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.uniform1i(current_program.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  setUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  gl.bindTexture(gl.TEXTURE_2D, null);
}


var old_time = Date.now();

function tick() {
// 	if (touches.length == 0)
// 	{
// 		if (mouseState == 0) // nothing touching
//  		mouseX = -1.0;
// 		if (touchCount > 0) // ie just released
// 		    player.pause();
// 	}
// 	else if (touches.length == 1)
// 	{
// 		if (touchCount == 0) { // ie just touched
// 		 	 PlaySound(1);
//       	player.loop = true;
//       }
// 		mouseX = touches[0].clientX/canvas.scrollWidth; //] (mouseX + 7.0*touches/canvas.scrollWidth)/8.0;
//		mouseY = 1.0-touches[0].clientY/canvas.scrollHeight; //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0;
//		mouseX1 = -1.0;
// 	}
// 	else if (touches.length >= 2)
// 	{
// 		mouseX = touches[0].clientX/canvas.scrollWidth; //] (mouseX + 7.0*touches/canvas.scrollWidth)/8.0;
//		mouseY = 1.0-touches[0].clientY/canvas.scrollHeight; //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0;
//     mouseX1 = touches[1].clientX/canvas.scrollWidth; //] (mouseX + 7.0*touches/canvas.scrollWidth)/8.0;
//		mouseY1 = 1.0-touches[1].clientY/canvas.scrollHeight; //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0;

// 	}
// 	touchCount = touches.length;
  requestAnimFrame(tick);
  drawScene();
}

function webGLStart() {
  initShaders();
  initBuffers();
  initTexture();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

var redIncreasing = 1;
var greenIncreasing = 0;
var blueIncreasing = 1;
var red;
var green;
var blue;
function startShades()
{
	if (Math.random() > .5)
    redIncreasing = 1;
	else
	  redIncreasing = 0;
	if (Math.random() > .5)
    blueIncreasing = 1;
	else
	  blueIncreasing = 0;
	if (Math.random() > .5)
    greenIncreasing = 1;
	else
	  greenIncreasing = 0;
	red = Math.floor(Math.random() * 255);
	if (red == 1)
	  red = 2;
	green = Math.floor(Math.random() * 255);
	blue =  Math.floor(Math.random() * 255);
	return 'rgb(' + red + ',' + green + ',' + blue + ')';
}

StoreValue = function (key, value) {
  if (window.localStorage) {
     window.localStorage.setItem(key, value);
  }
};

RetrieveValue = function(key, defaultValue) {
  var got;
  try {
   if (window.localStorage) {
     got = window.localStorage.getItem(key);
     if (got === 0) {
      return got;
     }
     if (got === "") {
      return got;
     }
     if (got) {
      return got;
     }
     return defaultValue;
   }
   return defaultValue;
  } catch (e) {
     return defaultValue;
  }
};

var chromeOS = /(CrOS)/.test(navigator.userAgent);
function LoadSettings() {

  if (chromeOS) {
       chrome.storage.local.get('colocoSettings', function (result) {
            if (result.colocoSettings == undefined)
              return;
            console.log(result.colocoSettings);
            colocoSettings = result.colocoSettings
        });
        for (var i = 0; i < 18; i++)
            colocoSettings[i] = parseInt(colocoSettings[i]);

  }
  else {
    for (var i = 0; i < 18; i++) {
    // StoreValue("Setting"+i, colocoSettings[i]);
      colocoSettings[i] = RetrieveValue("Setting"+i, colocoSettings[i]);
    }
  }
}

function SaveSettings() {
  if (chromeOS) {
    chrome.storage.local.clear();
    chrome.storage.local.set({colocoSettings: colocoSettings}, function () {
            var error = chrome.runtime.lastError;
    if (error) {
        console.error(error);
    }
    });
  }
  else {
    for (var i = 0; i < 18; i++)
     StoreValue("Setting"+i, colocoSettings[i]);
  }
}

function nextShade(f)
{
	if (redIncreasing == 1)
		red += f;
	else
		red -= f;
	if (red > 255) {
		redIncreasing = 0;
		red = 255;
	}
	if (red < 0) {
		redIncreasing = 1;
		red = 0;
	}
	if (blueIncreasing)
		blue += f;
	else
		blue -= f;
	if (blue > 255) {
		blueIncreasing = 0;
		blue = 255;
	}
	if (blue < 0) {
		blueIncreasing = 1;
		blue = 0;
	}
	if (greenIncreasing)
		green += f;
	else
		green -= f;
	if (green > 255) {
		greenIncreasing = 0;
		green = 255;
	}
	if (green < 0) {
		greenIncreasing = 1;
		green = 0;
	}
	if (red == 1)
	  red = 2;
	return 'rgb(' + red + ',' + green + ',' + blue + ')';
}

var lastColour = -1;
function NewBrightColor()
{
	var c;
	lastColour++;
	if (lastColour > 5)
		lastColour = 0;
	switch (lastColour)	{
	case 0:
		c = 'red';
		break;
	case 1:
		c = 'lime';
		break;
	case 2:
		c = 'blue';
		break;
	case 3:
    c = 'fuchsia';
		break;
	case 4:
    c = 'yellow';
		break;
	case 5:
    c = 'magenta';
		break;
	default:
	  c = 'white';
		break;
	}
	return(c);
}

var count = 0;
var current = 0;
var smoothMax = 0;
var scaleMax = 0;


function MonitorKeyUp(e) {
  if (!e) e=window.event;
    if (e.keyCode == 32 || e.keyCode == 49)
      Action(4);
    if (e.keyCode == 50)
		Action(2);
    if (e.keyCode == 51  || e.keyCode == 13)
		Action(3);
    if (e.keyCode == 52)
		Action(1);
   return false;
}

var mouseState = 0;


StoreValue = function (key, value) {
  if (window.localStorage) {
     window.localStorage.setItem(key, value);
  }
};

RetrieveValue = function(key, defaultValue) {
  var got;
  try {
   if (window.localStorage) {
     got = window.localStorage.getItem(key);
     if (got == 0) {
      return got;
     }
     if (got == "") {
      return got;
     }
     if (got) {
      return got;
     }
     return defaultValue;
   }
   return defaultValue;
  } catch (e) {
     return defaultValue;
  }
};

function WiggleButtons() {
  button[0].style.transform = "rotate(0deg)";
  button[1].style.transform = "rotate(0deg)";
  button[2].style.transform = "rotate(0deg)";
  button[3].style.transform = "rotate(0deg)";
  button[4].style.transform = "rotate(0deg)";
  button[5].style.transform = "rotate(0deg)";
}

function back () {
    canvas.hidden = true;
    canvas2.hidden = true;
    fun1.hidden = true;
    fun2.hidden = true;
    fun3.hidden = true;
    if (screenState == 2) {
      fun.hidden = false;
      screenState = 1;
      gobutton.hidden = false;
      for (var i = 0; i < 5; i++) {
    	  sbutton[i].hidden = false;
    	  kbutton[i].hidden = false;
      }
      for (var i = 0; i < 4; i++)
    	  lbutton[i].hidden = false;
    }
    else {
      fun.hidden = true;
      splash.style.backgroundImage = "url('images/splash.jpg')";
      screenState = 0;
      splash.hidden = false;
      for (var i = 0; i < 6; i++)
        button[i].hidden = false;
      btnBack.hidden = true;
      splash.style.zIndex = 999;
      smartphoneIcon.hidden = false;
    }
}

var doingFore = false;
function camStart() {
  splash  = document.querySelector('splash');
  btnContext  = document.querySelector('btnContext');

  settings  = document.querySelector('settings');
  gobutton  = document.querySelector('gobutton');
  for (var i = 0; i < 6; i++) {
    button[i] = document.querySelector('button'+i);
    sbutton[i] = document.querySelector('sbutton'+i);
    kbutton[i] = document.querySelector('kbutton'+i);
  }
  for (var i = 0; i < 5; i++) {
    lbutton[i] = document.querySelector('lbutton'+i);
  }
  btnBack = document.querySelector('back');
  fun = document.querySelector('fun');
  fun1 = document.querySelector('fun1');
  fun2 = document.querySelector('fun2');
  fun3 = document.querySelector('fun3');
  smartphoneIcon = document.querySelector('smartphone');
  canvas = document.getElementById("analyser");

  analyserContext = canvas.getContext('2d');
  canvas.style.backgroundColor = 'black';

    WiggleButtons();
    LoadSettings();

  btnBack.onclick = function(e) {
    back();
  }

  fun.onclick = function(e) {
    doingFun = 1 - doingFun;
    if (doingFun == 1)
      fun.style.backgroundColor = 'darkblue';
    else
      fun.style.backgroundColor = 'black';
  }

  fun1.onclick = function(e) {
    Param1++;
    if (Param1 > 4)
      Param1 = 0;
  }


  fun2.onclick = function(e) {
    Param2++;
    if (Param2 > 2)
      Param2 = 0;
  }

  fun3.onclick = function(e) {
    Param3++;
    if (Param3 > 1)
      Param3 = 0;
  }

  btnContext.onclick = function(e) {
    back();
  }

  for (var i = 0; i < 6; i++) {
 	  button[i].onmousedown = function(e) {
    	Action(parseInt(e.currentTarget.id));
    }
  }
  for (var i = 0; i < 5; i++) {
 	  sbutton[i].onmousedown = function(e) {
 	    for (var j = 0; j < 5; j++)
 	      sbutton[j].style.backgroundColor = 'black';
 	    e.currentTarget.style.backgroundColor = 'darkblue';
  	  changeColour = parseInt(e.currentTarget.id);
  	  colocoSettings[index*3] = changeColour;
 	  }
 	  kbutton[i].onmousedown = function(e) {
 	    for (var j = 0; j < 5; j++)
 	      kbutton[j].style.backgroundColor = 'black';
 	    e.currentTarget.style.backgroundColor = 'darkblue';
  	  mirrorStyle = parseInt(e.currentTarget.id);
  	  colocoSettings[index*3+1] = mirrorStyle;
 	  }
  }
  for (var i = 0; i < 4; i++)
 	  lbutton[i].onmousedown = function(e) {
 	    for (var j = 0; j < 4; j++)
 	      lbutton[j].style.backgroundColor = 'black';
 	    e.currentTarget.style.backgroundColor = 'darkblue';
    	lineWidth = parseInt(e.currentTarget.id)+1;
  	  colocoSettings[index*3+2] = lineWidth-1;
  }

  gobutton.onclick = function(e) {
    canvas.hidden = false;
    fun.hidden = true;
    if (doingFun == 1) {
      if (changeColour == 1 || changeColour == 2)
        fun2.hidden = false;
      fun3.hidden = false;
    }
    fun1.hidden = false;
    SaveSettings();
    analyserContext.fillRect(0, 0, canvas.width, canvas.height);
    screenState = 2;
    gobutton.hidden = true;
    for (var i = 0; i < 5; i++) {
  	  button[i].hidden = true;
  	  sbutton[i].hidden = true;
  	  kbutton[i].hidden = true;
    }
    smartphoneIcon.hidden = true;
    for (var i = 0; i < 4; i++)
  	  lbutton[i].hidden = true;
   canvas2.hidden = false;

  }
  canvas2 = document.getElementById("webgl-canvas");
  canvas2.style.width = "100vw";
  canvas2.style.height = "100vh";
  canvas2.style.zOrder = 993;
  try {
      gl = canvas2.getContext("experimental-webgl");
  } catch (e) {
  }
  if (!gl) {
      alert("Could not initialise WebGL, sorry :-(");
  }
  canvas2.style.backgroundImage = gobutton.style.backgroundImage;
  webGLStart();
}


var previousX = 0;
var previousY = 0;
var mirrorStyle = 0;
var perspective = 0;
var lineWidth = 4;
var wiggleLineWidth = 0;
var blending = 0; // context.globalCompositeOperation = "multiply"; etc
var shape = 0; // 0: line, 1: fan, 2: stripey line, 3: altenative invert, 4: circles, 5: '+'s, 6: rectangles
var fading = 0;
var changeColour = 0; // 0: fixed, 3: click, 4: timed, 1: shades, 2: shades 2, 0: random
var rectangular = 0; // 0: normal, 1: vertical, 2: horizontal, 3: grid, 4: horizontal or vertical
var shaderEffects = 0;
var currentColour = 'white';
var stripey = 1; // 0: normal, 1: stripes, 2: boxes

function drawPoint(x,y) {
  var w;
  previousX = x;
  previousY = y;
  switch (stripey) {
    case 0:
      analyserContext.lineCap = 'round';
      break;
    case 1:
      analyserContext.lineCap = 'butt';
      break;
    case 2:
      analyserContext.lineCap = 'square';
      break;
  }
  w = 1000/((5-lineWidth)*20);
 	if (perspective == 1) {
			w /= ((canvas.scrollHeight-y) + 1) / canvas.scrollHeight;
			w = Math.min (w, 50);
   }
  analyserContext.lineWidth = w;
//  analyserContext.globalCompositeOperation = "xor";
  switch (rectangular) {
    case 1:
      break;
    case 2:
      break;
    case 3:
      x -= x % 50;
      y -= y % 50;
      break;
    case 4:
      break;
  }
  switch (changeColour) {
    case 0:
      currentColour = NewBrightColor();
      break;
    case 1:
      currentColour = startShades();
      break;
    case 2:
      currentColour = startShades();
      break;
    case 3:
      currentColour = NewBrightColor();
      break;
    case 4:
      function colourChange() {
        if (changeColour == 4)
          currentColour = NewBrightColor();
          setTimeout(colourChange, 2000);
      }
      colourChange();
      break;
  }

  analyserContext.strokeStyle = currentColour;
  analyserContext.beginPath();
  analyserContext.moveTo(x,y);
  analyserContext.lineTo(x+.001,y);

  switch (mirrorStyle) {
    case 1:
        analyserContext.moveTo(canvas.width-x,y);
        analyserContext.lineTo(canvas.width-x-0.01,y);
      break;
    case 2:
        analyserContext.moveTo(x,canvas.height-y);
        analyserContext.lineTo(x-0.01,canvas.height-y);
      break;
    case 3:
        analyserContext.moveTo(canvas.width-x,y);
        analyserContext.lineTo(canvas.width-x-0.01,y);
        analyserContext.moveTo(x,canvas.height-y);
        analyserContext.lineTo(x-0.01,canvas.height-y);
        analyserContext.moveTo(canvas.width-x,canvas.height-y);
        analyserContext.lineTo(canvas.width-x-0.01,canvas.height-y);
      break;
    case 4:
        analyserContext.moveTo(canvas.width-x,y);
        analyserContext.lineTo(canvas.width-x-0.01,y);
        analyserContext.moveTo(x,canvas.height-y);
        analyserContext.lineTo(x-0.01,canvas.height-y);
        analyserContext.moveTo(canvas.width-x,canvas.height-y);
        analyserContext.lineTo(canvas.width-x-0.01,canvas.height-y);

        analyserContext.moveTo(y,x);
        analyserContext.lineTo(y-0.01,x);
        analyserContext.moveTo(canvas.width-y,x);
        analyserContext.lineTo(canvas.width-y-0.01,x);
        analyserContext.moveTo(y,canvas.height-x);
        analyserContext.lineTo(y-0.01,canvas.height-x);
        analyserContext.moveTo(canvas.width-y,canvas.height-x);
        analyserContext.lineTo(canvas.width-y-0.01,canvas.height-x);
        break;
  }
  analyserContext.stroke();
}


function drawLine(x,y) {
  if (index == 3) {
  analyserContext.globalAlpha=0.02;
  analyserContext.fillRect(0, 0, canvas.width, canvas.height);
  analyserContext.globalAlpha=1.00;
  }
  switch (rectangular) {
    case 1:
      previousY = 1000;
      previouxX = x;
      break;
    case 2:
      previousX = 0;
      previousY = y;
      break;
    case 3:
      x -= x % 50;
      y -= y % 50;
      break;
    case 4:
      if (Math.abs(x-previousX) < Math.abs(y-previousY))
        x=previousX;
      else
        y=previousY;
      break;
  }
  var w = 1000/((5-lineWidth)*20);
  switch (changeColour) {
    case 1:
      currentColour = nextShade(8);
      break;
    case 2:
      currentColour = nextShade(2);
      break;
    case 0:
      currentColour = NewBrightColor();
      break;
  }

   if (perspective == 1) {
  		w /= ((canvas.scrollHeight-y) + 1) / canvas.scrollHeight;
  		w = Math.min (w, canvas.scrollHeight / 20);
   }
   if (wiggleLineWidth == 1)
   	w *= 1+Math.random()/3;
  analyserContext.lineWidth = w;
  analyserContext.strokeStyle = currentColour;
  analyserContext.beginPath();
  analyserContext.moveTo(previousX,previousY);
  analyserContext.lineTo(x,y);

  switch (mirrorStyle) {
    case 1:
        analyserContext.moveTo(canvas.width-previousX,previousY);
        analyserContext.lineTo(canvas.width-x,y);
      break;
    case 2:
        analyserContext.moveTo(previousX,canvas.height-previousY);
        analyserContext.lineTo(x,canvas.height-y);
      break;
    case 3:
        analyserContext.moveTo(canvas.width-previousX,previousY);
        analyserContext.lineTo(canvas.width-x,y);
        analyserContext.moveTo(previousX,canvas.height-previousY);
        analyserContext.lineTo(x,canvas.height-y);
        analyserContext.moveTo(canvas.width-previousX,canvas.height-previousY);
        analyserContext.lineTo(canvas.width-x,canvas.height-y);
      break;
    case 4:
        analyserContext.moveTo(canvas.width-previousX,previousY);
        analyserContext.lineTo(canvas.width-x,y);
        analyserContext.moveTo(previousX,canvas.height-previousY);
        analyserContext.lineTo(x,canvas.height-y);
        analyserContext.moveTo(canvas.width-previousX,canvas.height-previousY);
        analyserContext.lineTo(canvas.width-x,canvas.height-y);

        analyserContext.moveTo(previousY,previousX);
        analyserContext.lineTo(y,x);
        analyserContext.moveTo(canvas.width-previousY,previousX);
        analyserContext.lineTo(canvas.width-y,x);
        analyserContext.moveTo(previousY,canvas.height-previousX);
        analyserContext.lineTo(y,canvas.height-x);
        analyserContext.moveTo(canvas.width-previousY,canvas.height-previousX);
        analyserContext.lineTo(canvas.width-y,canvas.height-x);
        break;
  }
    if (stripey > 0) {
      for (var i = 0; i < 2; i++) {
        analyserContext.stroke();
        analyserContext.lineWidth *= .6;
        if (i == 0)
          analyserContext.strokeStyle = 'darkgrey';
        else
          analyserContext.strokeStyle = currentColour;
        switch (mirrorStyle) {
        case 1:
            analyserContext.moveTo(canvas.width-x,y);
            analyserContext.lineTo(canvas.width-x-0.01,y);
          break;
        case 2:
            analyserContext.moveTo(x,canvas.height-y);
            analyserContext.lineTo(x-0.01,canvas.height-y);
          break;
        case 3:
            analyserContext.moveTo(canvas.width-x,y);
            analyserContext.lineTo(canvas.width-x-0.01,y);
            analyserContext.moveTo(x,canvas.height-y);
            analyserContext.lineTo(x-0.01,canvas.height-y);
            analyserContext.moveTo(canvas.width-x,canvas.height-y);
            analyserContext.lineTo(canvas.width-x-0.01,canvas.height-y);
          break;
        case 4:
            analyserContext.moveTo(canvas.width-x,y);
            analyserContext.lineTo(canvas.width-x-0.01,y);
            analyserContext.moveTo(x,canvas.height-y);
            analyserContext.lineTo(x-0.01,canvas.height-y);
            analyserContext.moveTo(canvas.width-x,canvas.height-y);
            analyserContext.lineTo(canvas.width-x-0.01,canvas.height-y);

            analyserContext.moveTo(y,x);
            analyserContext.lineTo(y-0.01,x);
            analyserContext.moveTo(canvas.width-y,x);
            analyserContext.lineTo(canvas.width-y-0.01,x);
            analyserContext.moveTo(y,canvas.height-x);
            analyserContext.lineTo(y-0.01,canvas.height-x);
            analyserContext.moveTo(canvas.width-y,canvas.height-x);
            analyserContext.lineTo(canvas.width-y-0.01,canvas.height-x);
            break;
      }
    }
  }
  analyserContext.stroke();
  if (index != 1) {
    previousX = x;
    previousY = y;
  }
//  Param1 = 1.0;
}

function Action(i){
//  var img = "url(images/" + i + ".png)";
  btnContext.style.backgroundImage="url(images/" + (i+1) + ".png)";
  btnContext.style.backgroundColor = 'white';
  fun.hidden = false;

  for (var j = 0; j < 5; j++)
    sbutton[j].style.backgroundColor = 'black';
  sbutton[colocoSettings[i*3]].style.backgroundColor = 'darkblue';
  changeColour = colocoSettings[i*3];
  for (var j = 0; j < 5; j++)
    kbutton[j].style.backgroundColor = 'black';
  kbutton[colocoSettings[i*3+1]].style.backgroundColor = 'darkblue';
  mirrorStyle = colocoSettings[i*3+1];
  for (var j = 0; j < 4; j++)
    lbutton[j].style.backgroundColor = 'black';
  lbutton[colocoSettings[i*3+2]].style.backgroundColor = 'darkblue';
	lineWidth = colocoSettings[i*3+2]+1;


  screenState = 1;
//  splash.hidden = true;
  splash.style.backgroundImage = "url('images/menu.jpg')";
  splash.style.zIndex = 991;
  index = i;
  analyserContext.fillStyle = 'black';
  analyserContext.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < 6; i++)
    button[i].hidden = true;
  smartphoneIcon.hidden = true;
  btnBack.hidden = false;
  if (index == 2)
    rectangular = 3;
  else
    rectangular = 0;
  if (index == 4)
    stripey = 1;
  else if (index == 5)
    stripey = 2;
  else stripey = 0;
  aspect = canvasHeight/canvasWidth;
  canvas2.onkeyup = MonitorKeyUp;
  canvas2.onmousedown = function(e) {
		mouseX = e.clientX/canvas.scrollWidth;
 		mouseY = 1.0-e.clientY/canvas.scrollHeight;
    drawPoint(1000*mouseX,1000*mouseY);
    mouseState = 1;
  }
  canvas2.onmousemove = function(e) {
		mouseX = e.clientX/canvas.scrollWidth;
 		mouseY = 1.0-e.clientY/canvas.scrollHeight;
    if (mouseState == 1)
      drawLine(1000*mouseX,1000*mouseY);
  }
  canvas2.onmouseup = function(e) {
    mouseState = 0;
  }
  canvas2.onmouseleave = function(e) {
    mouseState = 0;
  }
	canvas2.addEventListener('touchmove', function(event) {
      event.preventDefault();
  		mouseX = event.touches[0].clientX/canvas.scrollWidth;
   		mouseY = 1.0-event.touches[0].clientY/canvas.scrollHeight;
			if (event.touches.length == 1)
			  drawLine(1000*event.touches[0].clientX/canvas.scrollWidth,1000*event.touches[0].clientY/canvas.scrollHeight); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
			else if (event.touches.length > 1) {
			  previousX = 1000*mouseX;
			  previousY = 1000*mouseX;
			  drawLine(1000*event.touches[1].clientX/canvas.scrollWidth,1000*event.touches[1].clientY/canvas.scrollHeight); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
			}
  }, false);
  canvas2.addEventListener('touchstart', function(event) {
    event.preventDefault();
		mouseX = event.touches[0].clientX/canvas.scrollWidth;
 		mouseY = 1.0-event.touches[0].clientY/canvas.scrollHeight;
		if (event.touches.length == 1)
		  drawPoint(1000*mouseX,1000*mouseY); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
		else if (event.touches.length > 1) {
		  previousX = 1000*mouseX;
		  previousY = 1000*mouseY;
		  drawLine(1000*event.touches[1].clientX/canvas.scrollWidth,1000*event.touches[1].clientY/canvas.scrollHeight); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
		}

    mouseState = 1;
  }, false);
  canvas2.addEventListener('touchend', function(event) {
    event.preventDefault();
	  mouseState = 0;
  }, false);
  canvas2.addEventListener('touchleave', function(event) {
    event.preventDefault();
		mouseState = 0;
  }, false);
}
