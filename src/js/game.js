

let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}

PIXI.utils.sayHello(type)

//Aliases
let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite,
    TextureCache = PIXI.utils.TextureCache,
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle,
    Container = PIXI.Container;

// game related variables
let gameOver = false;
let lifePoints = 5;

//Create a Pixi Application
let app = new PIXI.Application({
    transparent: true,
    width: 304,
    height: 304
});
// app.renderer.view.style.position = "absolute";
// app.renderer.view.style.display = "block";
// app.renderer.autoResize = true;
// app.renderer.resize(window.innerWidth, window.innerHeight);

// create Pixi containers
let gameScene = new Container();
let gameOverWinScene = new Container();
let gameOverLostScene = new Container();
gameOverWinScene.visible = false;
gameOverLostScene.visible = false;

app.stage.addChild(gameScene);
app.stage.addChild(gameOverWinScene);
app.stage.addChild(gameOverLostScene);

//Add the canvas that Pixi automatically created for you to the HTML document
document.querySelector("#pixiContainer").appendChild(app.view);

PIXI.loader
    .add("assets/tileset.json")
    .on("progress", loadProgressHandler)
    .load(setup);

// method to monitor the progress of PIXI loading images
function loadProgressHandler(loader, resource) {
    let text = "progress: " + loader.progress + "%";

    // Display the file `url` currently being loaded
    console.log("loading: " + resource.url);

    //Display the percentage of files currently loaded
    console.log(text);
}

// method to run the image after pixi finishes to convert it
function setup()
{
    console.log("setup");

    function dropKey() {
        grabbedKey = false;

        key.x = randomInt(0, app.stage.width - key.width);
        key.y = randomInt(0, app.stage.height - key.height);

        key.scale.set(1, 1);
    }
    function grabKey() {
        grabbedKey = true;

        // set the key position to be the onigiri position plus one small offset to give the illusion that
        // the onigiri has grabbed the key (and resize a bit as well...)
        key.scale.set(0.5, 0.5);
        key.x = onigiri.x + 8;
        key.y = onigiri.y + 8;
    }

    function checkHit(item1, item2) {
        // Define the variables we'll need to calculate
        let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

        // hit will determine whether there's a collision
        hit = false;

        // Find the center points of each sprite
        item1.centerX = item1.x + item1.width / 2;
        item1.centerY = item1.y + item1.height / 2;
        item2.centerX = item2.x + item2.width / 2;
        item2.centerY = item2.y + item2.height / 2;

        //Find the half-widths and half-heights of each sprite
        item1.halfWidth = item1.width / 2;
        item1.halfHeight = item1.height / 2;
        item2.halfWidth = item2.width / 2;
        item2.halfHeight = item2.height / 2;

        //Calculate the distance vector between the sprites
        vx = item1.centerX - item2.centerX;
        vy = item1.centerY - item2.centerY;

        //Figure out the combined half-widths and half-heights
        combinedHalfWidths = item1.halfWidth + item2.halfWidth;
        combinedHalfHeights = item1.halfHeight + item2.halfHeight;

        //Check for a collision on the x axis
        if (Math.abs(vx) < combinedHalfWidths) {

            //A collision might be occuring. Check for a collision on the y axis
            if (Math.abs(vy) < combinedHalfHeights) {

                //There's definitely a collision happening
                hit = true;
            } else {

                //There's no collision on the y axis
                hit = false;
            }
        } else {

            //There's no collision on the x axis
            hit = false;
        }

        //`hit` will be either `true` or `false`
        return hit;
    }

    function contain(sprite, container) {
        let collision = undefined;

        //Left
        if (sprite.x < container.x) {
            sprite.x = container.x;
            collision = "left";
        }

        //Top
        if (sprite.y < container.y) {
            sprite.y = container.y;
            collision = "top";
        }

        //Right
        if (sprite.x + sprite.width > container.width) {
            sprite.x = container.width - sprite.width;
            collision = "right";
        }

        //Bottom
        if (sprite.y + sprite.height > container.height) {
            sprite.y = container.height - sprite.height;
            collision = "bottom";
        }

        //Return the `collision` value
        return collision;
    }

    function gameLoop(delta) {
        // update the current game state
        state(delta);
    }

    function play(delta) {
        // Play area boundaries
        let playAreaBoundaries = {x: 5, y: 5, width: app.stage.width, height: app.stage.height};
        let collision = null;

        // Move the onigiri
        onigiri.x += onigiri.vx;
        onigiri.y += onigiri.vy;

        // Restrain the onigiri in the play area boundaries.
        // If the onigiri hits the play area boundaries immobilize it
        let cloudBoundaries = contain(onigiri, playAreaBoundaries);

        if (cloudBoundaries === "top" || cloudBoundaries === "bottom") {
            onigiri.vy *= 0;
        } else if (cloudBoundaries === "left" || cloudBoundaries === "right") {
            onigiri.vx *= 0;
        }

        // Move the clouds
        for (let i = 0; i < clouds.length; i++) {
            clouds[i].x += clouds[i].vx;
            clouds[i].y += clouds[i].vy;
            if (!collision && checkHit(onigiri, clouds[i])) {
                collision = clouds[i];
            }

            // Restrain the cloud in the play area boundaries.
            // If the cloud hits the play area boundaries, reverse its direction
            let cloudBoundaries = contain(clouds[i], playAreaBoundaries);

            if (cloudBoundaries === "top" || cloudBoundaries === "bottom") {
                clouds[i].vy *= -1;
            } else if (cloudBoundaries === "left" || cloudBoundaries === "right") {
                clouds[i].vx *= -1;
            }
        }

        // check if onigiri is touching a cloud
        if (collision) {
            gameSceneMessage.text = "Auch >_<\"";
            collision.tint = 0xff3300;
            onigiri.alpha = 0.5;

            if (collision != lastCloudCollision) {
                // onigiri is colliding with a different cloud so decrease the life points ...
                if (healthBar.decreaseLifePoints(1) < 1) {
                    gameOver = true;
                }

                // ... and if it has the key drop it
                if (grabbedKey) {
                    dropKey();
                }

                lastCloudCollision = collision;
            }

            collision = null;
        } else {
            lastCloudCollision = null;

            //if there's no collision, reset the message
            //text and the box's color
            gameSceneMessage.text = "";
            clouds.forEach(cloud => {
                cloud.tint = 0xFFFFFF ;
        });
            onigiri.alpha = 1;
        }

        // check if onigiri has reached the rainbow
        if (checkHit(onigiri, rainbow) && grabbedKey) {
            gameOver = true;

            gameSceneMessage.text = "Entering Wonderland...";
            gameSceneMessage.style.fontSize = 26;
            rainbow.tint = 0xccff99;
        } else {
            rainbow.tint = 0xFFFFFF ;
        }

        // check if onigiri has grabbed the key
        if (checkHit(onigiri, key)) {
            grabKey()
        }

        if (gameOver) {
            state = end;
        }
    }

    function end() {
        gameScene.visible = false;

        if (healthBar.getRemainingLifePoints() > 0 && grabbedKey) {
            gameOverWinScene.visible = true;
        } else {
            gameOverLostScene.visible = true;
        }
    }

    function initKeyCommands() {
        // Capture the keyboard arrow keys
        let left = keyboard(37),
            up = keyboard(38),
            right = keyboard(39),
            down = keyboard(40);

        // Left arrow key `press` method
        left.press = () => {
            // Change the onigiri's velocity when the key is pressed
            onigiri.vx = -1;
            // onigiri.vy = 0;
        };

        // Left arrow key `release` method
        left.release = () => {
            // If the left arrow has been released, and the right arrow isn't down,
            // and the onigiri isn't moving vertically:
            // Stop the onigiri
            if (!right.isDown && onigiri.vy === 0) {
                onigiri.vx = 0;
            }
        };

        // Up
        up.press = () => {
            onigiri.vy = -1;
            onigiri.vx = 0;
        };
        up.release = () => {
            if (!down.isDown && onigiri.vx === 0) {
                onigiri.vy = 0;
            }
        };

        // Right
        right.press = () => {
            onigiri.vx = 1;
            onigiri.vy = 0;
        };
        right.release = () => {
            if (!left.isDown && onigiri.vy === 0) {
                onigiri.vx = 0;
            }
        };

        // Down
        down.press = () => {
            onigiri.vy = 1;
            onigiri.vx = 0;
        };
        down.release = () => {
            if (!up.isDown && onigiri.vx === 0) {
                onigiri.vy = 0;
            }
        };
    }

    let lastCloudCollision = null;
    let state;
    let grabbedKey = false;
    let textures = PIXI.loader.resources["assets/tileset.json"].textures;
    let sky = new Sprite(textures["sky"]);
    let rainbow = new Sprite(textures["rainbow"]);
    let onigiri = new Sprite(textures["onigiri"]);
    let key = new Sprite(textures["key"]);
    let heart = new Sprite(textures["heart"]);
    let winScreen = new Sprite(textures["winScreen"]);
    let lostScreen = new Sprite(textures["lostScreen"]);
    let healthBar = new HealthBar();
    let clouds = [];

    let noOfAngryClouds = 3,
        spacing = 50,
        xOffset = onigiri.width;

    // message for gameScene
    let gameMessageStyle = new TextStyle({
        fontFamily: "Arial",
        wordWrap: true,
        wordWrapWidth: app.stage.width - 10,
        align: "center",
        fontSize: 20,
        fill: "white",
        stroke: '#b3e3ef',
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
    });
    let gameSceneText = "";
    let gameSceneMessage = new Text(gameSceneText, gameMessageStyle);
    gameSceneMessage.x = app.stage.width / 2;
    gameSceneMessage.y = 0;

    gameOverWinScene.addChild(winScreen);
    // message for game over win scene
    let gameOverWinSceneText = "Welcome to Rainbow Land!";
    let gameOverSceneWinMessage = new Text(gameOverWinSceneText, gameMessageStyle);
    gameOverWinScene.addChild(gameOverSceneWinMessage);

    gameOverLostScene.addChild(lostScreen);
    // message for game over lost scene
    let gameOverLostSceneText = "You lost...the wind blowed you away :(";
    let gameOverSceneLostMessage = new Text(gameOverLostSceneText, gameMessageStyle);
    gameOverLostScene.addChild(gameOverSceneLostMessage);

    // make sky as big as available space
    // sky.width = app.stage.width;
    // sky.height = app.stage.height;

    // add sprites to the stage
    // REMEMBER: app.stage is positional (like css)
    gameScene.addChild(sky);
    gameScene.addChild(onigiri);
    gameScene.addChild(rainbow);

    for (let i = 0; i < noOfAngryClouds; i++) {
        // make an agry cloud
        let angryCloud = new Sprite(textures["angryCloud"]);
        clouds.push(angryCloud);
        // Space each blob horizontally according to the `spacing` value.
        // `xOffset` determines the point from the left of the screen
        // at which the first blob should be added.
        let x = spacing * i + xOffset;
        // let x = randomInt(0, sky.width);

        // Give the blob a random y position
        //(`randomInt` is a custom function - see below)
        let y = randomInt(0, sky.height - angryCloud.height);

        //Set the blob's position
        angryCloud.x = x;
        angryCloud.y = y;
        angryCloud.vx = 0.5;
        angryCloud.vy = 0.5;

        //Add the blob sprite to the stage
        gameScene.addChild(angryCloud);
    }

    // position the magic key
    gameScene.addChild(key);
    key.x = randomInt(0, app.stage.width - key.width);
    key.y = randomInt(0, app.stage.height - key.height);
    key.vx = 0;
    key.vy = 0;

    gameScene.addChild(gameSceneMessage);

    // position the rainbow
    rainbow.x = app.stage.width - rainbow.width;
    rainbow.y = app.stage.height - rainbow.height;

    // position the onigiri
    onigiri.x = 0;
    onigiri.y = app.stage.height - onigiri.height;
    onigiri.vx = 0;
    onigiri.vy = 0;

    // render the healthbar
    healthBar.setLifePoints(5);

    initKeyCommands();

    state = play;
    app.ticker.add(delta => gameLoop(delta));
}

function HealthBar() {
    this._healthBar = new Container();
    this._lifePoints = 0;
    this._remainingLifePoints = 0;

    this.getRemainingLifePoints = function() {
        return this._remainingLifePoints;
    }

    this.setLifePoints = function (lifePoints) {
        this._lifePoints = lifePoints;
        this._remainingLifePoints = lifePoints;
        this._updateHealthBar();
    }

    this.increaseLifePoints = function (lps) {
        // increase max to available life span
        if (this._remainingLifePoints <= this._lifePoints + lps) {
            this._remainingLifePoints += lps;
        } else {
            this._remainingLifePoints = this._lifePoints;
        }
        this._updateHealthBar();

        return this._remainingLifePoints;
    }

    this.decreaseLifePoints = function(lps) {
        if (this._remainingLifePoints >= lps) {
            this._remainingLifePoints -= lps;
            this._healthBar.outer.width -= lps * 10;
        }

        return this._remainingLifePoints;
    }

    this._updateHealthBar = function() {
        /* by design we decided that 1 lp == 10px
		   therefore (e.g) if I have 15 lp, the lifebar will be 150px */
        let healthBarWidth = this._lifePoints * 10 + 5; // 5 if the margin right
        let healthBarHeight = 8;
        let lifeSpanWidth = this._remainingLifePoints * 10;
        let healthColor = 0x78d46b;  // green

        if (this._remainingLifePoints < Math.floor(this._lifePoints / 2)) {
            healthColor = 0xe88e00; // orange
        } else if (this._remainingLifePoints < Math.floor(this._lifePoints / 4)) {
            healthColor = 0xd00000; // red
        }

        // position the healthbar
        this._healthBar.position.set(app.stage.width - healthBarWidth, healthBarHeight / 2);
        gameScene.addChild(this._healthBar);

        // Create the black background rectangle
        let innerBar = new PIXI.Graphics();
        innerBar.beginFill(0x000000);
        innerBar.drawRect(0, 0, healthBarWidth, healthBarHeight);
        innerBar.endFill();

        // Create the front red rectangle
        let outerBar = new PIXI.Graphics();
        outerBar.beginFill(healthColor);
        outerBar.drawRect(0, 0, lifeSpanWidth, healthBarHeight);
        outerBar.endFill();
        this._healthBar.addChild(outerBar);
        this._healthBar.outer = outerBar;
    }
}

function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    // The `upHandler`
    key.upHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}

//The `randomInt` helper function
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
