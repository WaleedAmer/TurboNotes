var canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.style.width = canvas.width + 'px';
canvas.height = window.innerHeight;
canvas.style.height = canvas.height + 'px';

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;	

var padding = 20;

var pieces = [];
var cursorx = padding;
var cursory = padding;

var lineheights = [];
var currentline = 0;
lineheights[0] = 0;

var linespacing = 20;

var appendButton = {
	x: screenWidth - 50,
	y: screenHeight - 50,
	width: 45,
	height: 45
}

var clearButton = {
	x: 5,
	y: screenHeight - 50,
	width: 45,
	height: 45
}

// PAINT
var painting = false,
	lastX = 0,
	lastY = 0,
	lineThickness = 1;

window.onload = function(){

	window.setInterval(function(){
		update();
	}, 1000/60);

	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;
}

function update(){

	ctx.clearRect(0,0,screenWidth,screenHeight);

	ctx.fillStyle = 'green';
	ctx.fillRect(appendButton.x, appendButton.y, appendButton.width, appendButton.height)

	ctx.fillStyle = 'red';
	ctx.fillRect(clearButton.x, clearButton.y, clearButton.width,  clearButton.height)

	for (i=0; i<pieces.length; i++){
		var piece = pieces[i];
		ctx.fillStyle = 'black'//'hsl('+(i*36)+', 100%, 50%)';
		if (piece.relative){
			for (j=0; j<piece.pixels.length; j++){
				if (j%4 == 0) {
					var pixel = piece.pixels[j];
					ctx.fillRect((pixel.x*piece.scaleX)+piece.x, (pixel.y*piece.scaleY)+piece.y+piece.offsetY, pixel.width*piece.scaleX, pixel.height*piece.scaleY);
				}	
			}
		}
		else {
			for (j=0; j<piece.pixels.length; j++){
				if (j%1 == 0) {
					ctx.fillStyle = 'gray';
					var pixel = piece.pixels[j];
					ctx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
				}
			}
		}

	}
}

Mousetrap.bind('return', function(e){
	appendPiece();
});

Mousetrap.bind('c', function(e){
	clearPieces();
});

function appendPiece(){
	var piece = null;
	
	painting = false;

	pieceFrame();

	for (i=0; i<pieces.length; i++){
		if (pieces[i].appended == false){
			var piece = pieces[i];
			if (piece.height*piece.scaleY > lineheights[currentline]){
				lineheights[currentline] = piece.height*piece.scaleY;
			}
			if ((cursorx + (piece.width*piece.scaleX)) > screenWidth){
				cursorx = padding;
				cursory += lineheights[currentline] + (linespacing*piece.scaleY);
				currentline++;
				lineheights[currentline] = 0;
			}
			piece.line = currentline;
			piece.x = cursorx;
			piece.y = cursory;
			cursorx += (piece.width*piece.scaleX) + (padding);
			piece.appended = true;
			break;
		}
	}

	for (var j=0; j<pieces.length; j++){
		var piece2 = pieces[j];
		if ((piece2.height*piece2.scaleY) < lineheights[piece2.line]){
			piece2.offsetY = (lineheights[piece2.line]-(piece2.height*piece2.scaleY))/2
		}
	}
}

document.addEventListener('touchstart', function(e){
	startDraw(e);
}, false);
document.addEventListener('mousedown', function(e){
	startDraw(e);
}, false);
document.addEventListener('touchmove', function(e){
	e.preventDefault();
	moveDraw(e);
}, false);
document.addEventListener('mousemove', function(e){
	moveDraw(e);
}, false);
document.addEventListener('touchend', function(e){
	endDraw(e);
}, false);
document.addEventListener('mouseup', function(e){
	endDraw(e);
}, false);

function clearPieces(){
	while(pieces.length>0){
		pieces.pop();
		currentline = 0;
		cursorx = padding;
		cursory = padding;
	}
	for (var i=0; i<lineheights.length; i++){
		lineheights[i] = 0;
	}
}		

function startDraw(e){
	// Get touch location in canvas dimensions
	var rect = canvas.getBoundingClientRect();
	lastX = e.pageX - rect.left;
	lastY = e.pageY - rect.top;

	var touch = {
		x: lastX,
		y: lastY,
		width: 2,
		height: 2
	}

	if (collides(appendButton, touch)) {
		appendPiece();
		return;
	}

	if (collides(clearButton, touch)) {
		clearPieces();
		return;
	}

	painting = true

	var pxls = [{
		x: lastX,
		y: lastY,
		width: 8,
		height: 8
	}]
	var piece = {
		id: pieces.length,
		pixels: pxls,
		relative: false,
		appended: false,
		line: 0,
		offsetY: 0,
		scaleX: 1,
		scaleY: 1,
		averageX: 0,
		averageY: 0
	}

	if (pieces.length > 0 && pieces[pieces.length-1].relative){
		pieces[pieces.length] = piece
	}
	else if (pieces.length == 0){
		pieces[pieces.length] = piece
	}

}

function moveDraw(e){
	if (painting){
		// Get touch location in canvas dimensions
		var rect = canvas.getBoundingClientRect();
		var mouseX = e.pageX - rect.left;
		var mouseY = e.pageY - rect.top;

		// Find points in between
		var x1 = mouseX,
			x2 = lastX,
			y1 = mouseY,
			y2 = lastY;

		var steep = (Math.abs(y2 - y1) > Math.abs(x2 - x1));
		if (steep){
			var x = x1
			x1 = y1;
			y1 = x;

			var y = y2
			y2 = x2;
			x2 = y;
		}
		if (x1 > x2){
			var x = x1;
			x1 = x2;
			x2 = x;

			var y = y1;
			y1 = y2;
			y2 = y;
		}

		var dx = x2 - x1,
            dy = Math.abs(y2 - y1),
            error = 0,
            de = dy / dx,
            yStep = -1,
            y = y1;

        if (y1 < y2){
            yStep = 1;
        }

        lineThickness = 5 - Math.sqrt((x2 - x1) *(x2-x1) + (y2 - y1) * (y2-y1))/10;
        if (lineThickness < 2){
            lineThickness = 2;   
        }

        for (var x = x1; x < x2; x++){
            if (steep){
                var pixel = {
                	x: y,
                	y: x,
                	width: lineThickness,
                	height: lineThickness
                }
                pieces[pieces.length-1].pixels.push(pixel)
                //pc.pixels[pixels.length] = pixel;
            }
            else{
                var pixel = {
                	x: x,
                	y: y,
                	width: lineThickness,
                	height: lineThickness
                }
                pieces[pieces.length-1].pixels.push(pixel)
            }
            
            error += de;
            if (error >= 0.5){
                y += yStep;
                error -= 1.0;
            }
        }

        lastX = mouseX;
        lastY = mouseY;
	}
}

function endDraw(e){
	painting = false;
}

function pieceFrame(){
	var piece = pieces[pieces.length-1]
	console.log(piece)

	var minx = screenWidth,
		maxx = 0,
		miny = screenHeight,
		maxy = 0,
		sizex = 0,
		sizey = 0;

	for (var i=0; i<piece.pixels.length; i++){
		var n = piece.pixels[i];
		if (n.x < minx){
			minx = n.x;
		}
		if (n.y < miny){
			miny = n.y;
		}
		if (n.x > maxx){
			maxx = n.x;
		}
		if (n.y > maxy){
			maxy = n.y;
		}
	}

	for (var i=0; i<piece.pixels.length; i++){
		var pixel = piece.pixels[i];
		pixel.x -= minx;
		pixel.y -= miny;
	}

	sizex = maxx - minx;
	sizey = maxy - miny;
	piece.x = minx;
	piece.y = miny;
	piece.width = sizex;
	piece.height = sizey;
	piece.relative = true;
	piece.scaleX = 0.1;
	piece.scaleY = 0.1;

	console.log("\nX: "+minx+"\nY: "+miny+"\nWidth: "+sizex+"\nHeight: "+sizey)
}

// "a" and "b" are the two objects you're checking for a collision between
// make sure both objects have x, y, width & height defined
function collides(a,b) {
	//Returns boolean
	return a.x < (b.x+b.width) && 
	(a.x+a.width) > b.x &&
	a.y < (b.y+b.height) &&
	(a.y+a.height) > b.y;
}

window.onresize = function(){
	canvas.width = window.innerWidth;
	canvas.style.width = canvas.width + 'px';
	canvas.height = window.innerHeight;
	canvas.style.height = canvas.height + 'px';
	screenWidth = canvas.width;
	screenHeight = canvas.height;
}

function distance(a, b){
	return Math.sqrt((b.x - a.x)^2 + (b.y - a.y)^2)
}