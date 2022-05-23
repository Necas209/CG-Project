import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Octree } from 'three/examples/jsm/math/Octree';
import { Capsule } from 'three/examples/jsm/math/Capsule';

function main() {
	const clock = new THREE.Clock();

	const scene = new THREE.Scene();

	const axesHelper = new THREE.AxesHelper(5);
	axesHelper.position.setY(10);
	scene.add(axesHelper);

	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);

	// Renderer
	const renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.physicallyCorrectLights = true;


	document.body.appendChild(renderer.domElement);

	// Pointer-lock controls
	const menuPanel = document.getElementById('menuPanel');
	const startButton = document.getElementById('startButton');
	startButton.addEventListener(
		'click',
		function () {
			pl_controls.lock();
		},
		false
	);

	const pl_controls = new PointerLockControls(camera, renderer.domElement);
	pl_controls.addEventListener('lock', () => (menuPanel.style.display = 'none'));
	pl_controls.addEventListener('unlock', () => (menuPanel.style.display = 'block'));

	// Player controls
	const GRAVITY = 10;
	const STEPS_PER_FRAME = 5;

	const worldOctree = new Octree();

	const playerCollider = new Capsule(new THREE.Vector3(0, 0.5, 10), new THREE.Vector3(0, 2.3, 10), 0.2);

	const playerVelocity = new THREE.Vector3();
	const playerDirection = new THREE.Vector3();

	let playerOnFloor = false;

	const keyStates = {};
	document.addEventListener('keydown', (event) => {
		keyStates[event.code] = true;
	});
	document.addEventListener('keyup', (event) => {
		keyStates[event.code] = false;
	});

	document.body.addEventListener('mousemove', (event) => {
		if (document.pointerLockElement === document.body) {
			camera.rotation.y -= event.movementX / 500;
			camera.rotation.x -= event.movementY / 500;
		}
	});

	function playerCollisions() {
		const result = worldOctree.capsuleIntersect(playerCollider);
		playerOnFloor = false;
		if (result) {
			playerOnFloor = result.normal.y > 0;
			if (!playerOnFloor) {
				playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));
			}
			playerCollider.translate(result.normal.multiplyScalar(result.depth));
		}

	}

	function updatePlayer(deltaTime) {
		let damping = Math.exp(- 4 * deltaTime) - 1;
		if (!playerOnFloor) {
			playerVelocity.y -= GRAVITY * deltaTime;
			// small air resistance
			damping *= 0.1;
		}
		playerVelocity.addScaledVector(playerVelocity, damping);
		const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
		playerCollider.translate(deltaPosition);
		playerCollisions();
		camera.position.copy(playerCollider.end);
	}

	function getForwardVector() {
		camera.getWorldDirection(playerDirection);
		playerDirection.y = 0;
		playerDirection.normalize();
		return playerDirection;
	}

	function getSideVector() {
		camera.getWorldDirection(playerDirection);
		playerDirection.y = 0;
		playerDirection.normalize();
		playerDirection.cross(camera.up);
		return playerDirection;
	}

	function controls(deltaTime) {
		// gives a bit of air control
		const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);
		if (keyStates['KeyW']) {
			playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
		}
		if (keyStates['KeyS']) {
			playerVelocity.add(getForwardVector().multiplyScalar(- speedDelta));
		}
		if (keyStates['KeyA']) {
			playerVelocity.add(getSideVector().multiplyScalar(- speedDelta));
		}
		if (keyStates['KeyD']) {
			playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
		}
		if (playerOnFloor) {
			if (keyStates['Space']) {
				playerVelocity.y = 5;
			}
		}
	}

	function teleportPlayerIfOob() {
		if (camera.position.y <= -5) {
			playerCollider.start.set(0, 0.5, 10);
			playerCollider.end.set(0, 2, 10);
			playerCollider.radius = 0.35;
			camera.position.copy(playerCollider.end);
			camera.rotation.set(0, 0, 0);
		}
	}

	// Ground
	const planeGeometry = new THREE.PlaneGeometry(50, 50);
	const tex_loader = new THREE.TextureLoader();
	const color_map = tex_loader.load('textures/ground/Ground024_1K_Color.png');
	color_map.wrapS = THREE.RepeatWrapping;
	color_map.wrapT = THREE.RepeatWrapping;
	color_map.repeat.set(10, 10);
	const ground_material = new THREE.MeshStandardMaterial({
		map: color_map,
		aoMap: tex_loader.load('textures/ground/Ground024_1K_AmbientOcclusion.png'),
		normalMap: tex_loader.load('textures/ground/Ground024_1K_NormalGL.png'),
		roughnessMap: tex_loader.load('textures/ground/Ground024_1K_Roughness.png'),
		displacementMap: tex_loader.load('textures/ground/Ground024_1K_Displacement.png')
	});
	const ground = new THREE.Mesh(planeGeometry, ground_material);
	ground.rotateX(-Math.PI / 2);
	const world_objs = new THREE.Group();
	world_objs.add(ground);

	// House
	// const gltf_loader = new GLTFLoader();
	// gltf_loader.load('objects/dachniy_house/scene.gltf', (gltf) => {
	// 	gltf.scene.scale.set(0.03, 0.03, 0.03);
	// 	gltf.scene.rotateY(Math.PI);
	// 	gltf.scene.position.setY(0.4);
	// 	gltf.scene.traverse(child => {
	// 		if (child.isMesh) {
	// 			child.castShadow = true;
	// 			child.receiveShadow = true;
	// 		}
	// 	});
	// 	world_objs.add(gltf.scene);
	// 	worldOctree.fromGraphNode(world_objs);
	// });
	const gltf_loader = new GLTFLoader();
	gltf_loader.load('objects/old_house/scene.gltf', (gltf) => {
		gltf.scene.scale.set(0.015, 0.015, 0.015);
		//gltf.scene.rotateY(Math.PI);
		gltf.scene.position.set(-4, 0.4, 1);
		gltf.scene.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		world_objs.add(gltf.scene);
		worldOctree.fromGraphNode(world_objs);
	});
	
	// Picket fence
	const shape = new THREE.Shape();
	shape.moveTo(0, 0);
	shape.lineTo(0.2, 0);
	shape.lineTo(0.2, 0.9);
	shape.lineTo(0.7, 0.9);
	shape.lineTo(0.7, 1.1);
	shape.lineTo(0.2, 1.1);
	shape.lineTo(0.2, 1.5);
	shape.lineTo(0.7, 1.5);
	shape.lineTo(0.7, 1.7);
	shape.lineTo(0.2, 1.7);
	shape.lineTo(0.2, 2);
	shape.lineTo(0.1, 2.25);
	shape.lineTo(0, 2);
	shape.lineTo(0, 1.7);
	shape.lineTo(-0.5, 1.7);
	shape.lineTo(-0.5, 1.5);
	shape.lineTo(0, 1.5);
	shape.lineTo(0, 1.1);
	shape.lineTo(-0.5, 1.1);
	shape.lineTo(-0.5, 0.9);
	shape.lineTo(0, 0.9);
	shape.lineTo(0, 0);

	const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0 });
	const map = tex_loader.load('textures/fence/Wood033_1K_Color.png');
	map.wrapS = map.wrapT = THREE.RepeatWrapping;
	map.repeat.set(0.5, 0.5);
	const normalMap = tex_loader.load('textures/fence/Wood033_1K_NormalGL.png');
	normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
	normalMap.repeat.set(0.5, 0.5);
	const displacementMap = tex_loader.load('textures/fence/Wood033_1K_Displacement.png');
	displacementMap.wrapS = displacementMap.wrapT = THREE.RepeatWrapping;
	displacementMap.repeat.set(0.5, 0.5);

	const fence_material = new THREE.MeshPhysicalMaterial({
		map: map,
		aoMap: tex_loader.load('textures/fence/Wood033_1K_AmbientOcclusion.png'),
		normalMap: normalMap,
		roughnessMap: tex_loader.load('textures/fence/Wood033_1K_Roughness.png'),
		displacementMap: displacementMap,
		displacementScale: 0,
	});

	const fences = new THREE.Group();
	const fence = new THREE.Mesh(geometry, fence_material);
	for (let i = 0; i < 14; i++) {
		const temp = fence.clone();
		temp.position.set(-10 + 1.5 * i, 0, -10);
		fences.add(temp);
	}
	for (let i = 0; i < 14; i++) {
		const temp = fence.clone();
		temp.rotateY(Math.PI / 2);
		temp.position.set(-10, 0, -10 + 1.5 * i);
		fences.add(temp);
	}
	for (let i = 0; i < 14; i++) {
		if (i != 7)
		{
			const temp = fence.clone();
			temp.position.set(-10 + 1.5 * i, 0, 10);
			fences.add(temp);
		}
	}
	for (let i = 0; i < 14; i++) {
		const temp = fence.clone();
		temp.rotateY(Math.PI / 2);
		temp.position.set(10, 0, -10 + 1.5 * i);
		fences.add(temp);
	}
	world_objs.add(fences);

	// Trees
	const treePositions = [
		[15, 0, -15], [13, 0, -9], [15, 0, -1],
		[14.5, 0, 0], [13.5, 0, 10], [15, 0, 18],
		[8, 0, 13.5], [-1, 0, 17], [-5, 0, 15],
		[-13, 0, 15], [-17, 0, 6], [-15, 0, 4], 
		[-14, 0, -1], [-11, 0, -15], [-13.5, 0, -13],
		[-10, 0, -17], [-6, 0, -13], [0, 0, -13.5],
		[1, 0, -15], [8, 0, -14]
	];
	gltf_loader.load('objects/pine_tree/scene.gltf', (gltf) => {
		gltf.scene.scale.set(0.04, 0.04, 0.04);
		gltf.scene.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		const trees = new THREE.Group();
		for(let i = 0; i < 20; i++)
		{
			const tree = gltf.scene.clone();
			tree.position.set(treePositions[i][0], treePositions[i][1], treePositions[i][2]);
			trees.add(tree);
		}
		world_objs.add(trees);
	});

	scene.add(world_objs);
	worldOctree.fromGraphNode(world_objs);

	// Ambient light
	const light = new THREE.AmbientLight(0xFFFFE0, 1.5);
	scene.add(light);

	// Background - Night Sky
	const background_loader = new THREE.CubeTextureLoader();
	background_loader.load([
		'textures/background/pos-x.png',
		'textures/background/neg-x.png',
		'textures/background/pos-y.png',
		'textures/background/neg-y.png',
		'textures/background/pos-z.png',
		'textures/background/neg-z.png',
	], (texture) => {
		scene.background = texture;
	});

	renderer.render(scene, camera);

	window.addEventListener('resize', onWindowResize, false);
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();
	}

	function render() {
		const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
		// we look for collisions in substeps to mitigate the risk of
		// an object traversing another too quickly for detection.
		for (let i = 0; i < STEPS_PER_FRAME; i++) {
			controls(deltaTime);
			updatePlayer(deltaTime);
			teleportPlayerIfOob();
		}
		// Update render
		renderer.render(scene, camera);
		// Callback
		requestAnimationFrame(render);
	}
}

main();