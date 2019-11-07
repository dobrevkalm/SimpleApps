// select canvas element
const canvas = document.getElementById("pong");

// getContext of canvas = methods and properties to draw and do a lot of thing to the canvas
const ctx = canvas.getContext('2d');

/**
 * GAME OBJECTS
 */

// Ball
const ball = {
    xPos : canvas.width/2,
    yPos : canvas.height/2,
    radius : 12,
    xVelocity : 5,
    yVelocity : 5,
    speed : 10,
    color : "YELLOW"
}

// Player pad
const player = {
    xPos : 10,
    yPos : (canvas.height - 100)/2,
    width : 15,
    height : 100,
    result : 0,
    color : "#2e86c1"
}

// AI pad
const AI = {
    xPos : canvas.width - 25,
    yPos : (canvas.height - 100)/2,
    width : 15,
    height : 100,
    result : 0,
    color : "#2e86c1"
}

// Net
const net = {
    xPos : (canvas.width - 2)/2,
    yPos : 0,
    height : 10,
    width : 5,
    color : "WHITE"
}


/**
 * DRAW FUNCTIONS
 */

// Rectangle for the pads
function drawRect(xPos, yPos, w, h, color){
    ctx.fillStyle = color;
    ctx.fillRect(xPos, yPos, w, h);
}

// Draw goals (penalty box)
function drawGoal(xPos, yPos, w, h) {
    ctx.beginPath();
    ctx.lineWidth = "5";
    ctx.strokeStyle = "WHITE";
    ctx.rect(xPos, yPos, w, h);
    ctx.stroke();
}

// Circle for the ball
function drawCircle(xPos, yPos, rad, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(xPos, yPos, rad, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
}

// Draw a net using drawRect function
function drawNet(){
    for(let i=0; i<=canvas.height; i+=25){
        drawRect(net.xPos, net.yPos + i, net.width, net.height, net.color);
    }
}

// The result
function drawResult(res, xPos, yPos){
    ctx.fillStyle = "WHITE";
    ctx.font = "50px calibri";
    ctx.fillText(res, xPos, yPos);
}

// Move player pad with the mouse
canvas.addEventListener("mousemove", getMousePos);

function getMousePos(evt) {
    let rect = canvas.getBoundingClientRect();
    player.yPos = evt.clientY - rect.top - player.height/2;
}

// Reset the ball after a goal
function resetBall(){
    ball.xPos = canvas.width/2;
    ball.yPos = canvas.height/2;
    ball.xVelocity = -ball.xVelocity;
    ball.speed = 10;
}

// Hit the ball with a pad
function hit(ball, pad) {
    pad.top = pad.yPos;
    pad.bottom = pad.yPos + pad.height;
    pad.left = pad.xPos;
    pad.right = pad.xPos + pad.width;

    ball.top = ball.yPos - ball.radius;
    ball.bottom = ball.yPos + ball.radius;
    ball.left = ball.xPos - ball.radius;
    ball.right = ball.xPos + ball.radius;

    return pad.left < ball.right &&
           pad.top < ball.bottom &&
           pad.right > ball.left &&
           pad.bottom > ball.top;
}


/**
 * This is where all the calculations happen:
 *
 *  - update the score if the ball position goes outside of the canvas width (below or over)
 *  - update (move) ball possition by increasing it's x and y position
 *  - simulate AI behavior
 *  - change ball direction when a wall is hit (top or bottom of the canvas field)
 *  - hit the ball with a pad:
 *      1) Check hit pad (player or AI)
 *      2) Get the collision coordinates
 *      3) Normalize the value of the collisionPoint.
 *         It has to be between -1 and 1 (-padToHit.height/2 < collide Point < padToHit.height/2)
 *      4) Angle the ball's direction depending on which part of the pad hits it:
 *          = if the ball hits the top of the pad, it takes a -45° angle
 *          = hitting the top gives a 45° angle
 *      5) Reverce the direction of the ball after hit
 *      6) Increase the moving speed of the ball after a hit
 */
function updateObjects(){
    // update the result (if the ball goes insode the goal - scorer gets 3pts)
    if (ball.xPos - ball.radius < 0) {
        if ((ball.yPos - ball.radius) > canvas.height/3 && (ball.yPos + ball.radius) < 2*canvas.height/3) {
            AI.result += 3;
            resetBall();
        } else {
            AI.result++;
            resetBall();
        }

    } else if (ball.xPos + ball.radius > canvas.width) {
        if ((ball.yPos - ball.radius) > canvas.height/3 && (ball.yPos + ball.radius) < 2*canvas.height/3) {
            player.result += 3;
            resetBall();
        } else {
            player.result++;
          resetBall();
        }
    }

    // move the ball
    ball.xPos += ball.xVelocity;
    ball.yPos += ball.yVelocity;

    // simple AI simulation
    AI.yPos += ((ball.yPos - (AI.yPos + AI.height/2)))*0.1;

    // ball direction change
    if(ball.yPos - ball.radius < 0 || ball.yPos + ball.radius > canvas.height){
        ball.yVelocity = -ball.yVelocity;
    }

    // hit the ball
    let padToHit = (ball.xPos + ball.radius < canvas.width/2) ? player : AI;
    // 1)
    if(hit(ball, padToHit)) {
        // 2)
        let collisionPoint = (ball.yPos - (padToHit.yPos + padToHit.height/2));
        // 3)
        collisionPoint = collisionPoint / (padToHit.height/2);
        // 4)
        let angle = (Math.PI/4) * collisionPoint;
        // 5)
        let moveDirection = (ball.xPos + ball.radius < canvas.width/2) ? 1 : -1;
        ball.xVelocity = moveDirection * ball.speed * Math.cos(angle);
        ball.yVelocity = ball.speed * Math.sin(angle);
        // 6)
        ball.speed = ball.speed < 15 ? ball.speed + 0.5 : ball.speed;
    }
}

function reset() {
    AI.result = 0;
    player.result = 0;
    resetBall();
}

/**
 * This function draws all the objects.
 * Calling the function multiple times per second together with the
 * updateObjects function will create an animation.
 */
function drawObjects(){

    // Draw the main canvas field and the net
    drawRect(0, 0, canvas.width, canvas.height, "#006428");
    drawNet();

    // Draw the goals
    drawGoal(-5, canvas.height/3, canvas.width/7, canvas.height/3);
    drawGoal((canvas.width+5-canvas.width/7), canvas.height/3, canvas.width/7, canvas.height/3);

    // Display the ball
    drawCircle(ball.xPos, ball.yPos, ball.radius, ball.color);

    // Show player result and game pad
    drawResult(player.result, canvas.width/4, canvas.height/8);
    drawRect(player.xPos, player.yPos, player.width, player.height, player.color);

    // Show AI result and pad
    drawResult(AI.result, canvas.width - canvas.width/4, canvas.height/8);
    drawRect(AI.xPos, AI.yPos, AI.width, AI.height, AI.color);
}

function play() {
    updateObjects();
    drawObjects();
}