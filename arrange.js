var arrange = function () {
    var V, center;
    var canvas, context;
    var drawInt, forceInt;
    
    //spring stuff
    var equilibrium;
    var k;
    return {
	init: function () { 
	    //setup
	    canvas = document.getElementById('canvas');
	    context = canvas.getContext('2d');
	    V = [];
	    
	    //add central node
	    center = arrange.createCenter('Math');
	    
	    //add subnode
	    arrange.createNode(arrange.randomVector(), 'Algebra');
	    arrange.createNode(arrange.randomVector(), 'Calculus');
	    arrange.createNode(arrange.randomVector(), 'Discrete');
	    arrange.createNode(arrange.randomVector(), 'Probability');
	    
	    //begin draw/placement loop
	    arrange.draw();
	    forceInt = setInterval(function() {arrange.forces();}, 1);
	    drawInt = setInterval(function() {arrange.draw();}, 1);
	},
	
	 randomVector: function() {
	     return $V([Math.floor(Math.random()*canvas.width)+1,
			Math.floor(Math.random()*canvas.height)+1]); 
	 },
	
	createCenter: function(title) {
	    return {
		pos: $V([canvas.width/2, canvas.height/2]),
		F: $V[0,0],
		words: title,
	    };
	},
	
	createNode: function (loc,name) {
	    V.push({
		pos: loc,
		F: $V([0,0]),
		words: name,
		apply: function(dt) {
		    this.pos = this.pos.add(this.F);
		    this.F = Vector.Zero(2);
		},
		addForce: function(nF) {
		    this.F = this.F.add(nF);
		},
	    });
	},
	
	forces: function () {
	    //spring force along every edge
	    V.map(arrange.spring);
	    
	    //apply vectors on unique pairs of nodes.
 	    for (var i = 0 ; i < V.length ;i++) {
		for (var j = 0 ; j < V.length ; j++) {
		    if (i !== j) {
			arrange.magnetic(V[i],V[j]);
		    }
		}
	    }
	    
	    //stop it if fractional F
	    var done = true;
	    V.map(function(node) {
		var t = node.F.modulus();
		done = (t > .1) ? false : done;
	    });
	    if (done === true) {
		clearInterval(forceInt);
		clearInterval(drawInt);
	    }
	    
	    //apply force vectors and clear F
	    V.map(function(node) {node.apply();});
	},
	
	spring: function(node) {
	    //adds spring force toward center. F = kx
	    var k = .05;
	    var x = node.pos.distanceFrom(center.pos) - canvas.width / 3;
	    var F = center.pos.subtract(node.pos).toUnitVector();
	    //scale
	    F = F.map(function(e) {return e*k*x;});
	    //apply
	    node.addForce(F);
	},
	
	magnetic: function(a, b) {
	    //F = K_e/r^2
	    var k = 50000;
	    var r2 = Math.pow(a.pos.distanceFrom(b.pos), 2);
	    var F = a.pos.subtract(b.pos).toUnitVector();
	    //scale
	    F = F.map(function (e) {return e* k / r2;});
	    //apply
	    a.addForce(F);
	},
	
	draw: function() {
	    //background white.
	    context.fillStyle = "#FFF";
	    context.fillRect(0,0,canvas.width,canvas.height);
	    context.stroke();
	    
	    arrange.drawEdges();
	    arrange.drawNode(center);
	    V.map(arrange.drawNode);
	},
	
	drawEdges: function (node) {
	    V.map(function(node) {
		//line
		context.beginPath();
		context.strokeStyle = '#000';
		context.lineWidth = 1;
		context.moveTo(node.pos.e(1),node.pos.e(2));
		context.lineTo(center.pos.e(1),center.pos.e(2));
		context.stroke();
	    });
	},
	
	drawNode: function (node) {
	    context.textAlign = 'center';
	    context.font = '20pt Arial';
	    var h = context.measureText('M').width;
	    var w = context.measureText(node.words).width;
	    
	    //draw square over the edges to prevent the ugly
	    context.beginPath();
	    context.rect(node.pos.e(1) - w/2 - 3,
			 node.pos.e(2) - h/2 - 3, w + 6, h + 6);
	    context.fillStyle= '#FFF';
	    context.strokeStyle = '#FFF';
	    context.fill();
	    context.stroke();

	    if (node !== center) {
		arrange.endPoint(node, center, context.measureText(center.words).width, h);
		arrange.endPoint(center, node, w, h);
	    }
	    
	    context.fillStyle = '#333';
	    context.fillText(node.words, node.pos.e(1), node.pos.e(2)+.5*h);
	},
	
	click: function(x,y) {
	    
	},

	endPoint: function(node, box, w, h) {
	    //draws endpoints on line from node to center
	    var x = node.pos;
	    var y = box.pos;

	    var m = (x.e(2) - y.e(2)) / (x.e(1)-y.e(1));
	    var b = -m*y.e(1) + y.e(2);
	    //y = mx+b
	    //x = (y-b)/m

	    //bounding box
	    var top = y.e(2) - .5*h - 3;
	    var bot = y.e(2) + .5*h + 3;
	    var left = y.e(1) - .5*w - 3;
	    var right = y.e(1) + .5*w + 3;
	    
	    var candidates = [];
	    
	    //straight left and right slope is zero
	    if (m === 0) {
		candidates.push($V([right, m*right+b]));
		candidates.push($V([left, m*left+b]));
	    }
	    else if (m === NaN) {
		candidates.push($V([(top-b)/m, top]));
		candidates.push($V([(bot-b)/m, bot]));
	    }
	    if (left <= (top - b) / m && (top - b) / m <= right) {
		//crosses the top
		candidates.push($V([(top - b) / m, top]));
	    }
	    if (top <= m*right+b && m*right+b<= bot) {
		//crosses right
		candidates.push($V([right, m*right+b]));
	    }
	    if (left <= (bot - b) / m && (bot - b) / m <= right) {
		//crosses the bottom
		candidates.push($V([(bot - b) / m, bot]));
	    }
	    if (top <= m*left+b && m*left+b<= bot) {
		//crosses left
		candidates.push($V([left, m*left+b]));
	    }

	    var end = candidates[0];
	    //divide by zero dies here!!!!!! TODO: fix
	    if (candidates[1].distanceFrom(x) < end.distanceFrom(x)) {
		end = candidates[1];
	    }
	    
	    context.beginPath();
	    context.arc(end.e(1), end.e(2), 2, 0, 2*Math.PI, false);
	    context.fillStyle = 'black';
	    context.strokeStyle = 'black';
	    context.fill();
	    context.stroke();
	}
    };
}();

if (window.addEventListener) {
    window.addEventListener("load", arrange.init, false);
} else if (window.attachEvent) {
    window.attachEvent("onload", arrange.init);
} else {
    window["onload"] = arrange.init;
}

