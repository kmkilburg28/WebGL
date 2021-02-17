
/**
 * @returns {number[]}
 */
function createMap() {
	return [
		[0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0,],
		[0, 0, 0, 0, 0, 0, 0, 0,],
	];
}

/**
 * @returns {ObjectData[]}
 */
function getData() {

	let base = [];
	let mapIds = createMap();
	let originOffsetRow = (mapIds.length - 1) / 2;
	for (let row = 0; row < mapIds.length; row++)
	{
		let originOffsetCol = (mapIds[row].length - 1) / 2;
		for (let col = 0; col < mapIds[row].length; col++)
		{
			if (mapIds[row][col] >= 0)
				base.push(new ObjectData(new THREE.Vector3(row - originOffsetRow, 0, col - originOffsetCol), mapIds[row][col]));
		}
	}

	return base.concat([
		new ObjectData(new THREE.Vector3(-3, 1, 3), 1),
		new ObjectData(new THREE.Vector3(-3.5, 1-0.1875, -0.5), 2),
		new ObjectData(new THREE.Vector3(-3.5, 2, -0.5), 3),
	]);
}

/**
 * @returns {ObjectType[]}
 */
function getTypes() {
	let torchLight = new THREE.PointLight(0xFFFE9D, 0.85, 16);
	torchLight.position.set(0, 0.375, 0);
	torchLight.castShadow = true;
	torchLight.shadow.mapSize.width = 128;
	torchLight.shadow.mapSize.height = 128;
	return {
		t0: new ObjectType(0, 0, 0, 1),
		t1: new ObjectType(1, 1, 1, 0),
		t2: new ObjectType(2, 2, 2, null, torchLight),
		t3: new ObjectType(3, 3, 3, null)
	};
}

/**
 * @returns {THREE.Geometry[]}
 */
function getGeometries() {
	return {
		t0: new THREE.BoxGeometry( 1, 1, 1 ),
		t1: new THREE.SphereGeometry( 1, 32, 32 ),
		t2: new THREE.BoxGeometry( 0.125, 0.625, 0.125 ),
		t3: new THREE.PlaneGeometry( 1, 1 ),
	}
}

async function getMaterials() {

	let grass = await createGrass();
	return {
		t0: grass,
		t1: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
		t2: createTorch(),
		t3: createLiveView({position: new THREE.Vector3(0, 15, 0), lookAt: new THREE.Vector3(0, 0, 0)})
	}
}

function createTorch()
{
	const loader = new THREE.TextureLoader();
	const textureCubeSide = loader.load( "../images/torch/torch.png" );
	textureCubeSide.minFilter = THREE.NearestFilter;
	textureCubeSide.magFilter = THREE.NearestFilter;
	const textureCubeTop = loader.load( "../images/torch/torch_top.png" );
	textureCubeTop.minFilter = THREE.NearestFilter;
	textureCubeTop.magFilter = THREE.NearestFilter;

	let materialSide = new THREE.MeshBasicMaterial( { map: textureCubeSide } );

	return [
		materialSide,
		materialSide,
		new THREE.MeshBasicMaterial( { map: textureCubeTop } ),
		null,
		materialSide,
		materialSide,
	];
}

async function createGrass()
{
	const loader = new THREE.TextureLoader();
	const grassTextureCubeBottom = loader.load( "../images/grass/dirt.png" );
	grassTextureCubeBottom.minFilter = THREE.NearestFilter;
	grassTextureCubeBottom.magFilter = THREE.NearestFilter;
	const grassTextureCubeSide = loader.load( "../images/grass/grass_block_side.png" );
	grassTextureCubeSide.minFilter = THREE.NearestFilter;
	grassTextureCubeSide.magFilter = THREE.NearestFilter;
	const grassTextureCubeTop = loader.load( "../images/grass/grass_block_top.png" );
	grassTextureCubeTop.minFilter = THREE.NearestFilter;
	grassTextureCubeTop.magFilter = THREE.NearestFilter;

	const grassTextureCubeSideOverlay = loader.load( "../images/grass/grass_block_side_overlay.png" );
	grassTextureCubeSideOverlay.minFilter = THREE.NearestFilter;
	grassTextureCubeSideOverlay.magFilter = THREE.NearestFilter;


	let tintColor = 0x00ff00;
	let uniforms = {
		tintColor: { value: new THREE.Vector3(
			((tintColor & 0xFF0000) >> 16) / 0xff,
			((tintColor &   0xFF00) >> 8)  / 0xff,
			 (tintColor &     0xFF)        / 0xff)},
		tSamplerBase: { value: grassTextureCubeSide },
		tSamplerOverlay: { value: grassTextureCubeSideOverlay },
	};
	let vertShader = document.getElementById('tintVertexShader').innerHTML;
	let fragShader = document.getElementById('tintFragmentShader').innerHTML;
	let grassTintSide = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertShader,
		fragmentShader: fragShader,
	});

	
	// *** this creates the FBO and sets the texture parameters ***
	let rtTexture = new THREE.WebGLRenderTarget( 16, 16, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
	// rtTexture = new THREE.WebGLRenderTarget( 16, 16, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
	// Set up the scene to render to texture, this code is just copied from RotatingSquare.js
	let cameraRTT = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
	cameraRTT.position.z = 1;
	let sceneRTT = new THREE.Scene();
	let rtGeometry = new THREE.PlaneGeometry(1, 1);
	let rtMesh = new THREE.Mesh(rtGeometry, grassTintSide);
	// let rtMesh = new THREE.Mesh(rtGeometry, new THREE.MeshBasicMaterial( { color: 0xff0000 } ));
	rtMesh.scale.set(2, 2, 2);
	sceneRTT.add(rtMesh);

	// *** This renders the first scene with the FBO as its target ***
	renderer.setRenderTarget(rtTexture);

	for (let i = 0; i < 10; i++)
	{
		await new Promise(resolve => {
			requestAnimationFrame(() => {
				renderer.render(sceneRTT, cameraRTT);
				resolve();
			});
		});
	}
	
	 // render to canvas
	 renderer.setRenderTarget(null);
	 renderer.setClearColor(0xffffff);

	// let grassTintSideTinted = grassTintSide;
	let grassTintSideTinted = new THREE.MeshLambertMaterial( { color: 0xffffff, map: rtTexture.texture } );
	return [
		grassTintSideTinted,
		grassTintSideTinted,
		new THREE.MeshLambertMaterial( { color: tintColor, map: grassTextureCubeTop } ),
		new THREE.MeshLambertMaterial( { map: grassTextureCubeBottom } ),
		grassTintSideTinted,
		grassTintSideTinted,
	];
}

/**
 * @param {{position: THREE.Vector3, lookAt: THREE.Vector3}} data 
 */
function createLiveView(data) {
	// Set up the scene to render to texture, this code is just copied from RotatingSquare.js
	// const cameraRTT = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 1000);
	const cameraRTT = new THREE.PerspectiveCamera(45, 1, 0.1, 1000 );
	worldDummy.add(cameraRTT);
	cameraRTT.position.set(data.position.x, data.position.y, data.position.z);
	cameraRTT.lookAt(data.lookAt);

	// *** this creates the FBO and sets the texture parameters ***
	const rtTexture1 = new THREE.WebGLRenderTarget( 512, 512, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat });
	const rtTexture2 = rtTexture1.clone();
	const textures = [rtTexture1, rtTexture2];
	let textureInd = 0;

	const mesh = new THREE.MeshBasicMaterial( { color: 0xffffff, map: textures[textureInd ? 0 : 1].texture } );
	animations.push(function() {
		// *** This renders the first scene with the FBO as its target ***
		renderer.setRenderTarget(textures[textureInd]);
		renderer.render(scene, cameraRTT);
		renderer.setRenderTarget(null);
		mesh.map = textures[textureInd].texture;
		textureInd = textureInd ? 0 : 1;
	});
	return mesh;
}

function loadSkyboxMap() {
	const loader = new THREE.CubeTextureLoader();
	loader.setPath('../images/skybox/');

	const textureCube = loader.load([
		'row-2-col-3.png', 'row-2-col-1.png',
		'row-1-col-2.png', 'row-3-col-2.png',
		'row-2-col-2.png', 'row-2-col-4.png',
	]);
	textureCube.minFilter = THREE.NearestFilter;
	textureCube.magFilter = THREE.NearestFilter;
	return textureCube;
}

/**
 * @param {String} folderPath 
 * @param {THREE.Vector3} bodyPosition 
 */
function createPlayer(folderPath) {
	const loader = new THREE.TextureLoader();
	const head_right  = loader.load( folderPath + "/head_right.png" );
	const head_left   = loader.load( folderPath + "/head_left.png" );
	const head_top    = loader.load( folderPath + "/head_top.png" );
	const head_bottom = loader.load( folderPath + "/head_bottom.png" );
	const head_front  = loader.load( folderPath + "/head_front.png" );
	const head_back   = loader.load( folderPath + "/head_back.png" );
	head_right.minFilter = THREE.NearestFilter;
	head_right.magFilter = THREE.NearestFilter;
	head_left.minFilter = THREE.NearestFilter;
	head_left.magFilter = THREE.NearestFilter;
	head_top.minFilter = THREE.NearestFilter;
	head_top.magFilter = THREE.NearestFilter;
	head_bottom.minFilter = THREE.NearestFilter;
	head_bottom.magFilter = THREE.NearestFilter;
	head_front.minFilter = THREE.NearestFilter;
	head_front.magFilter = THREE.NearestFilter;
	head_back.minFilter = THREE.NearestFilter;
	head_back.magFilter = THREE.NearestFilter;

	const head_materials = [
		new THREE.MeshLambertMaterial( { map: head_left } ),
		new THREE.MeshLambertMaterial( { map: head_right } ),
		new THREE.MeshLambertMaterial( { map: head_top } ),
		new THREE.MeshLambertMaterial( { map: head_bottom } ),
		new THREE.MeshLambertMaterial( { map: head_front } ),
		new THREE.MeshLambertMaterial( { map: head_back } ),
	];

	const body_right  = loader.load( folderPath + "/body_right.png" );
	const body_left   = loader.load( folderPath + "/body_left.png" );
	const body_top    = loader.load( folderPath + "/body_top.png" );
	const body_bottom = loader.load( folderPath + "/body_bottom.png" );
	const body_front  = loader.load( folderPath + "/body_front.png" );
	const body_back   = loader.load( folderPath + "/body_back.png" );
	body_right.minFilter = THREE.NearestFilter;
	body_right.magFilter = THREE.NearestFilter;
	body_left.minFilter = THREE.NearestFilter;
	body_left.magFilter = THREE.NearestFilter;
	body_top.minFilter = THREE.NearestFilter;
	body_top.magFilter = THREE.NearestFilter;
	body_bottom.minFilter = THREE.NearestFilter;
	body_bottom.magFilter = THREE.NearestFilter;
	body_front.minFilter = THREE.NearestFilter;
	body_front.magFilter = THREE.NearestFilter;
	body_back.minFilter = THREE.NearestFilter;
	body_back.magFilter = THREE.NearestFilter;

	const body_materials = [
		new THREE.MeshLambertMaterial( { map: body_right } ),
		new THREE.MeshLambertMaterial( { map: body_left } ),
		new THREE.MeshLambertMaterial( { map: body_top } ),
		new THREE.MeshLambertMaterial( { map: body_bottom } ),
		new THREE.MeshLambertMaterial( { map: body_front } ),
		new THREE.MeshLambertMaterial( { map: body_back } ),
	];

	const arm_outside  = loader.load( folderPath + "/arm_outside.png" );
	const arm_inside   = loader.load( folderPath + "/arm_inside.png" );
	const arm_top      = loader.load( folderPath + "/arm_top.png" );
	const arm_bottom   = loader.load( folderPath + "/arm_bottom.png" );
	const arm_front    = loader.load( folderPath + "/arm_front.png" );
	const arm_back     = loader.load( folderPath + "/arm_back.png" );
	arm_outside.minFilter = THREE.NearestFilter;
	arm_outside.magFilter = THREE.NearestFilter;
	arm_inside.minFilter = THREE.NearestFilter;
	arm_inside.magFilter = THREE.NearestFilter;
	arm_top.minFilter = THREE.NearestFilter;
	arm_top.magFilter = THREE.NearestFilter;
	arm_bottom.minFilter = THREE.NearestFilter;
	arm_bottom.magFilter = THREE.NearestFilter;
	arm_front.minFilter = THREE.NearestFilter;
	arm_front.magFilter = THREE.NearestFilter;
	arm_back.minFilter = THREE.NearestFilter;
	arm_back.magFilter = THREE.NearestFilter;

	const arm_right_materials = [
		new THREE.MeshLambertMaterial( { map: arm_outside } ),
		new THREE.MeshLambertMaterial( { map: arm_inside } ),
		new THREE.MeshLambertMaterial( { map: arm_top } ),
		new THREE.MeshLambertMaterial( { map: arm_bottom } ),
		new THREE.MeshLambertMaterial( { map: arm_front } ),
		new THREE.MeshLambertMaterial( { map: arm_back } ),
	];
	const arm_left_materials = [
		new THREE.MeshLambertMaterial( { map: arm_inside } ),
		new THREE.MeshLambertMaterial( { map: arm_outside } ),
		new THREE.MeshLambertMaterial( { map: arm_top } ),
		new THREE.MeshLambertMaterial( { map: arm_bottom } ),
		new THREE.MeshLambertMaterial( { map: arm_front } ),
		new THREE.MeshLambertMaterial( { map: arm_back } ),
	];
	
	const leg_outside  = loader.load( folderPath + "/leg_outside.png" );
	const leg_inside   = loader.load( folderPath + "/leg_inside.png" );
	const leg_top      = loader.load( folderPath + "/leg_top.png" );
	const leg_bottom   = loader.load( folderPath + "/leg_bottom.png" );
	const leg_front    = loader.load( folderPath + "/leg_front.png" );
	const leg_back     = loader.load( folderPath + "/leg_back.png" );
	leg_outside.minFilter = THREE.NearestFilter;
	leg_outside.magFilter = THREE.NearestFilter;
	leg_inside.minFilter = THREE.NearestFilter;
	leg_inside.magFilter = THREE.NearestFilter;
	leg_top.minFilter = THREE.NearestFilter;
	leg_top.magFilter = THREE.NearestFilter;
	leg_bottom.minFilter = THREE.NearestFilter;
	leg_bottom.magFilter = THREE.NearestFilter;
	leg_front.minFilter = THREE.NearestFilter;
	leg_front.magFilter = THREE.NearestFilter;
	leg_back.minFilter = THREE.NearestFilter;
	leg_back.magFilter = THREE.NearestFilter;

	const leg_right_materials = [
		new THREE.MeshLambertMaterial( { map: leg_inside } ),
		new THREE.MeshLambertMaterial( { map: leg_outside } ),
		new THREE.MeshLambertMaterial( { map: leg_top } ),
		new THREE.MeshLambertMaterial( { map: leg_bottom } ),
		new THREE.MeshLambertMaterial( { map: leg_front } ),
		new THREE.MeshLambertMaterial( { map: leg_back } ),
	];
	const leg_left_materials = [
		new THREE.MeshLambertMaterial( { map: leg_outside } ),
		new THREE.MeshLambertMaterial( { map: leg_inside } ),
		new THREE.MeshLambertMaterial( { map: leg_top } ),
		new THREE.MeshLambertMaterial( { map: leg_bottom } ),
		new THREE.MeshLambertMaterial( { map: leg_front } ),
		new THREE.MeshLambertMaterial( { map: leg_back } ),
	];

	const head_geometry = new THREE.BoxGeometry( 8*0.0625, 8*0.0625, 8*0.0625 );
	const body_geometry = new THREE.BoxGeometry( 8*0.0625, 12*0.0625, 4*0.0625 );
	const arm_geometry = new THREE.BoxGeometry( 4*0.0625, 12*0.0625, 4*0.0625 );
	const leg_geometry = arm_geometry;

	const head = new THREE.Mesh(head_geometry, head_materials);
	const body = new THREE.Mesh(body_geometry, body_materials);
	const arm_right = new THREE.Mesh(arm_geometry, arm_right_materials);
	const arm_left = new THREE.Mesh(arm_geometry, arm_left_materials);
	const leg_right = new THREE.Mesh(leg_geometry, leg_right_materials);
	const leg_left = new THREE.Mesh(leg_geometry, leg_left_materials);

	const headDummy = new THREE.Object3D();
	headDummy.add(head);
	headDummy.position.set(0, (6)*0.0625, 0);
	head.position.set(0, (4)*0.0625, 0);
	body.add(headDummy);
	const arm_rightDummy = new THREE.Object3D();
	arm_rightDummy.add(arm_right);
	arm_rightDummy.position.set(-(2+4)*0.0625, 5*0.0625, 0);
	arm_right.position.set(0, -5*0.0625, 0);
	body.add(arm_rightDummy);
	const arm_leftDummy = new THREE.Object3D();
	arm_leftDummy.add(arm_left);
	arm_leftDummy.position.set((2+4)*0.0625, 5*0.0625, 0);
	arm_left.position.set(0, -5*0.0625, 0);
	body.add(arm_leftDummy);
	const leg_rightDummy = new THREE.Object3D();
	leg_rightDummy.add(leg_right);
	leg_rightDummy.position.set(-2*0.0625, -(6+1)*0.0625, 0);
	leg_right.position.set(0, -5*0.0625, 0);
	body.add(leg_rightDummy);
	const leg_leftDummy = new THREE.Object3D();
	leg_leftDummy.add(leg_left);
	leg_leftDummy.position.set(2*0.0625, -(6+1)*0.0625, 0);
	leg_left.position.set(0, -5*0.0625, 0);
	body.add(leg_leftDummy);

	var angle = 0;
	var angleInc = Math.PI/180;
	var maxAngle = Math.PI/4
	animations.push(() => {
		headDummy.setRotationFromEuler(new THREE.Euler( angle, 0, 0, 'XYZ' ));
		arm_rightDummy.setRotationFromEuler(new THREE.Euler( angle, 0, 0, 'XYZ' ));
		arm_leftDummy.setRotationFromEuler(new THREE.Euler( -angle, 0, 0, 'XYZ' ));
		leg_rightDummy.setRotationFromEuler(new THREE.Euler( -angle, 0, 0, 'XYZ' ));
		leg_leftDummy.setRotationFromEuler(new THREE.Euler( angle, 0, 0, 'XYZ' ));
		angle += angleInc;
		if (angle < -maxAngle || angle > maxAngle)
			angleInc *= -1;
	});

	return body;
}

function loadOBJPromise(filename)
{
	return new Promise(function (resolve) {
		var objLoader = new THREE.OBJLoader();
		objLoader.load(filename, (loadedModel, materials) =>
			{
				resolve(loadedModel);
			}
		);
	});
}

function loadComplexOBJandMTLPromise(path)
{
	var mtlLoader = new THREE.MTLLoader();
	return new Promise(function (resolve) {
		mtlLoader.load( path + ".mtl", function( materials ) {

			materials.preload();

			var objLoader = new THREE.OBJLoader();
			objLoader.setMaterials( materials );
			objLoader.load( path + ".obj", function ( object ) {
				resolve(object);
			});

		});
	});
}