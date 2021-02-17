
/**
 * Using a hierarchical object in three.js.  This is similar
 * to HierarchyWithTree.js.  Each piece of the robot is
 * contained within a dummy object that is unscaled and only
 * rotates about its own center.  The visible object can then
 * be scaled without affecting the scales of its child
 * objects, and it can be shifted within the dummy object
 * to make it appear to rotate about a point other than its
 * center.
 *
 * Use a/A, s/S, t/T to rotate arm, shoulder, or torso.
 */
var animations = [];
var renderer = new THREE.WebGLRenderer({canvas: ourCanvas});
var worldDummy = new THREE.Object3D();
var scene;
/** @type {ObjectType[]} */
var objectTypes = getTypes();
/** @type {THREE.Geometry[]} */
var objectGeometries = getGeometries();
var objectMaterials;
var playerDummy;
var camera;
var handLight;
var handLightIntensity;
var ourCanvas = document.getElementById('theCanvas');

var live;

var localZKeyPress = 0;
var localXKeyPress = 0;
var localYKeyPress = 0;


//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
	if (event.which == null) {
		return String.fromCharCode(event.keyCode) // IE
	} else if (event.which!=0 && event.charCode!=0) {
		return String.fromCharCode(event.which)   // the rest
	} else {
		return null // special key
	}
}

function handleKeyPress(event)
{
	let ch = event.key.toLowerCase();
	if (event.type === "keydown")
	{
		switch(ch)
		{
			case 'w':
				localZKeyPress = 1;
				break;
			case 's':
				localZKeyPress = -1;
				break;
			case 'a':
				localXKeyPress = -1;
				break;
			case 'd':
				localXKeyPress = 1;
				break;
			case ' ':
				localYKeyPress = 1;
				break;
			case 'shift':
				localYKeyPress = -1;
				break;
			default:
				return;
		}
		// keysPressed[ch] = 1;
	}
	else if (event.type === "keyup")
	{
		switch(ch)
		{
			case 'w':
				if (localZKeyPress >= 1)
					localZKeyPress = 0;
				break;
			case 's':
				if (localZKeyPress <= -1)
					localZKeyPress = 0;
				break;
			case 'a':
				if (localXKeyPress <= -1)
					localXKeyPress = 0;	
				break;
			case 'd':
				if (localXKeyPress >= 1)
					localXKeyPress = 0;	
				break;
			case ' ':
				if (localYKeyPress >= 1)
					localYKeyPress = 0;	
				break;
			case 'shift':
				if (localYKeyPress <= -1)
					localYKeyPress = 0;	
				break;
			case 'enter':
				if (document.pointerLockElement != ourCanvas)
				{
					ourCanvas.requestPointerLock();
					live = 1;
				}
				break;
			case 'f':
				handLight.intensity = handLight.intensity ? 0.0 : handLightIntensity;
				break;
			default:
				return;
		}
		// keysPressed[ch] = 0;
	}
}
const sensitivity = 0.1
function handleMouseMove(event)
{
	if (live)
	{
		let position = playerDummy.position;
		playerDummy.position = new THREE.Vector3(0, 0, 0);
		playerDummy.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), sensitivity * -event.movementX / 180 * Math.PI);
		playerDummy.position = position;

		let quaternion = camera.quaternion.clone();
		camera.rotateX(sensitivity * -event.movementY / 180 * Math.PI);
		let z = new THREE.Vector3(
			camera.matrix.elements[8],
			camera.matrix.elements[9],
			camera.matrix.elements[10]
		);
		let angleTo = z.angleTo(new THREE.Vector3(0, 1, 0));
		let minVert = 8;
		if ((angleTo < Math.PI / minVert && -event.movementY < 0) || (angleTo > Math.PI * (minVert-1)/minVert && -event.movementY > 0))
		{
			camera.setRotationFromQuaternion(quaternion);
		}
	}
}

/**
 * @param {ObjectData} objectData 
 */
function constructModel(objectData)
{
	/** @type {ObjectType} */
	let typeInfo = objectTypes["t" + objectData.typeId];
	let geometry = objectGeometries["t" + typeInfo.geometryId];
	let material = objectMaterials["t" + typeInfo.materialId];

	let mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(objectData.position.x, objectData.position.y, objectData.position.z);

	if (typeInfo.shadowType === 0)
	{
		mesh.castShadow = true;
	}
	if (typeInfo.light)
	{
		mesh.add(typeInfo.light.clone());
	}
	return mesh;
}

/**
 * @param {Object3D} parent 
 * @param {ObjectData[]} children 
 */
function addData(parent, children)
{
	for (child of children)
	{
		let childMesh = constructModel(child);
		parent.add(childMesh);
	}
}

const translationInc = 0.2;
function move()
{
	if (localZKeyPress)
	{
		let z = new THREE.Vector2(
			playerDummy.matrix.elements[8],
			playerDummy.matrix.elements[10]
		);
		z.normalize();
		playerDummy.position.x += z.x * -translationInc * localZKeyPress;
		playerDummy.position.z += z.y * -translationInc * localZKeyPress;
	}
	if (localXKeyPress)
	{
		playerDummy.translateX(translationInc * localXKeyPress);
	}
	if (localYKeyPress)
	{
		playerDummy.position.y += translationInc * localYKeyPress;
	}
}

function lookAt(x, y, z)
{
	let matrix = playerDummy.matrix.clone();
	playerDummy.lookAt(new THREE.Vector3(x, playerDummy.position.y, z));
	playerDummy.rotateY(Math.PI);
}

async function start()
{
	window.onkeydown = handleKeyPress;
	window.onkeyup = handleKeyPress;
	window.onmousemove = handleMouseMove;

	scene = new THREE.Scene();
	playerDummy = new THREE.Object3D();
	playerDummy.position.set(6, 4, 12);
	camera = new THREE.PerspectiveCamera(45, 1.5, 0.1, 1000 );
	camera.translateY(0.5);
	lookAt(0, 0, 0);
	
	playerDummy.add(camera);
	ourCanvas.requestPointerLock();
	document.addEventListener('pointerlockchange', (e) => {
		if (document.pointerLockElement != ourCanvas)
		{
			live = 0;
		}
	});

	renderer = new THREE.WebGL1Renderer({canvas: ourCanvas});
	objectMaterials = await getMaterials();
	renderer.setClearColor(0xffffff);
	renderer.shadowMap.enabled = true;

	// worldDummy is parent of all other objects

	addData(worldDummy, getData());
	addData(playerDummy, [
		new ObjectData(new THREE.Vector3(-0.425, -0.35, -1), 2),
		new ObjectData(new THREE.Vector3(0.425, -0.35, -1), 3),
	]);
	handLight = playerDummy.children[1].children[0];
	handLightIntensity = handLight.intensity;
	// handLight.material.color = 0x0;
	playerDummy.children[1].rotateX(-Math.PI/6);
	playerDummy.children[2].scale.set(0.6, 0.6, 0.6);
	playerDummy.children[2].rotateX(-Math.PI/6);
	worldDummy.add(playerDummy);
	let bodyDummy = createPlayer("../images/player");
	bodyDummy.position.set(3.5, 1.5+0.125, -3.5);
	worldDummy.add(bodyDummy);
	// load full model; and a second one to attempt to texture it
	let obj = await loadOBJPromise("../obj/Smaug/smaug.obj");
	let obj2 = await loadComplexOBJandMTLPromise("../obj/Smaug/smaug");
	obj.scale.set(0.06, 0.06, 0.06);
	obj2.scale.set(0.06, 0.06, 0.06);
	obj.position.set(-1, 0.5, -2);
	obj2.position.set(-1, 0.5, -2);
	worldDummy.add(obj);
	worldDummy.add(obj2);
	var dragonLight = new THREE.PointLight(0xff4444, 1.0, 2);
	obj2.add(dragonLight);
	dragonLight.position.set(0, 12, 20);

	// add world dummy to the scene
	scene.background = loadSkyboxMap();
	scene.add( worldDummy );
	scene.scale.set(4, 4, 4);


	var light = new THREE.PointLight(0xffffff, 0.8);
	light.position.set(2, 3, 5);
	light.castShadow = true;
	light.shadow.mapSize.width = 128;
	light.shadow.mapSize.height = 128;
	scene.add(light);

	light = new THREE.AmbientLight(0x555555);
	scene.add(light);

	var render = function () {
		requestAnimationFrame( render );
		if (live)
		{
			renderer.render(scene, camera);

			move();
			for (let animation of animations)
				animation();
		}

	};

	live = 1;
	render();
}
window.onload = start;
