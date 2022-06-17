import * as THREE from 'three';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls';
import {Octree} from 'three/examples/jsm/math/Octree';
import {Capsule} from 'three/examples/jsm/math/Capsule';
import {World} from 'World';
import {Flashlight, House} from 'objects';

function main() {
	// Clock and scene
	const clock = new THREE.Clock();
	const scene = new THREE.Scene();
	// Player constants
	const GRAVITY = 10;
	const STEPS_PER_FRAME = 5;
	// World octree - for collisions
	const worldOctree = new Octree();
	// Player variables
	const playerCollider = new Capsule(
		new THREE.Vector3(3, 0.8, 2),
		new THREE.Vector3(3, 2.5, 2),
		0.2
	);
	const playerVelocity = new THREE.Vector3();
	const playerDirection = new THREE.Vector3();
	let playerOnFloor = false;
	// Cameras set-up
	// 0 -> Perspective Camera
	// 1 -> Orthographic Camera
	let cameraType = 0;
	const cameras = [];
	// Perspective camera
	const perspectiveCamera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	cameras.push(perspectiveCamera);
	// Orthographic camera
	const orthographicCamera = new THREE.OrthographicCamera(
		window.innerWidth / -50,
		window.innerWidth / 50,
		window.innerHeight / 50,
		window.innerHeight / -50,
		-100,
		1000
	);
	orthographicCamera.position.set(3, 3, 2);
	orthographicCamera.lookAt(scene.position);
	cameras.push(orthographicCamera);
	// Add flashlight
	const flashlight = new Flashlight();
	perspectiveCamera.add(flashlight);
	perspectiveCamera.add(flashlight.target);
	scene.add(perspectiveCamera);
	// Renderer
	const renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.physicallyCorrectLights = true;
	// renderer.shadowMap.enabled = true;
	// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.body.appendChild(renderer.domElement);
	// Pointer-lock controls
	const menuPanel = document.getElementById('menuPanel');
	const startButton = document.getElementById('startButton');
	let pl_controls = new PointerLockControls(perspectiveCamera, renderer.domElement);
	pl_controls.addEventListener('lock', () => menuPanel.style.display = 'none');
	pl_controls.addEventListener('unlock', () => menuPanel.style.display = 'block');
	startButton.addEventListener('click', () => pl_controls.lock(), false);
	// Player controls and helper functions
	const keyStates = {};
	document.addEventListener('keydown', event => keyStates[event.code] = true);
	document.addEventListener('keyup', event => keyStates[event.code] = false);
	let intersects = [];
	document.addEventListener('keypress', event => {
		// Turn on/off flashlight
		if (event.code === 'KeyF') {
			flashlight.turn_on_off();
		}
		// Check player interactions with scene
		if (event.code === 'KeyE') {
			House.check_interactions(intersects);
		}
		// Switch cameras
		if (event.code === 'KeyC') {
			cameraType = cameraType === 0 ? 1 : 0;
		}
	});

	// Player functions
	function playerCollisions() {
		const door_res = House.doorsOctree.capsuleIntersect(playerCollider);
		let result = worldOctree.capsuleIntersect(playerCollider);
		result = door_res === false ? result : door_res;
		playerOnFloor = false;
		if (result) {
			playerOnFloor = result.normal.y > 0;
			if (!playerOnFloor) {
				playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
			}
			playerCollider.translate(result.normal.multiplyScalar(result.depth));
		}

	}

	function updatePlayer(deltaTime) {
		let damping = Math.exp(-4 * deltaTime) - 1;
		if (!playerOnFloor) {
			playerVelocity.y -= GRAVITY * deltaTime;
			// small air resistance
			damping *= 0.1;
		}
		playerVelocity.addScaledVector(playerVelocity, damping);
		const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
		playerCollider.translate(deltaPosition);
		playerCollisions();
		perspectiveCamera.position.copy(playerCollider.end);
	}

	function getForwardVector() {
		perspectiveCamera.getWorldDirection(playerDirection);
		playerDirection.y = 0;
		playerDirection.normalize();
		return playerDirection;
	}

	function getSideVector() {
		perspectiveCamera.getWorldDirection(playerDirection);
		playerDirection.y = 0;
		playerDirection.normalize();
		playerDirection.cross(perspectiveCamera.up);
		return playerDirection;
	}

	function controls(deltaTime) {
		// gives a bit of air control
		const speedDelta = deltaTime * (playerOnFloor ? 15 : 8);
		if (keyStates['KeyW']) {
			playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
		}
		if (keyStates['KeyS']) {
			playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
		}
		if (keyStates['KeyA']) {
			playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
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
		if (perspectiveCamera.position.y <= -5) {
			playerCollider.start.set(0, 0.5, 10);
			playerCollider.end.set(0, 2, 10);
			playerCollider.radius = 0.35;
			perspectiveCamera.position.copy(playerCollider.end);
			perspectiveCamera.rotation.set(0, 0, 0);
		}
	}

	// World objects
	World.add_ground(scene);
	World.add_house(scene);
	World.add_picket_fence(scene);
	World.add_porch_lights(scene);
	World.add_trees(scene, worldOctree);
	worldOctree.fromGraphNode(scene);
	House.add_doors(scene);
	// Ambient light
	const ambientLight = new THREE.AmbientLight(0xffffe0, 1.5);
	scene.add(ambientLight);
	const hemisphereLight = new THREE.HemisphereLight(0xc1445, 0x01322, 1);
	scene.add(hemisphereLight);
	// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
	// directionalLight.lookAt(scene.position);
	// scene.add(directionalLight);
	// Background - Night Sky
	const backgroundLoader = new THREE.CubeTextureLoader();
	backgroundLoader.load([
		'textures/background/pos-x.png',
		'textures/background/neg-x.png',
		'textures/background/pos-y.png',
		'textures/background/neg-y.png',
		'textures/background/pos-z.png',
		'textures/background/neg-z.png',
	], texture => scene.background = texture);
	// check for window resize
	window.addEventListener('resize', () => {
		cameras[cameraType].aspect = window.innerWidth / window.innerHeight;
		cameras[cameraType].updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();
	}, false);
	const raycaster = new THREE.Raycaster();
	let mouse = new THREE.Vector2();
	document.addEventListener('mousemove', event => {
		mouse = new THREE.Vector2(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1
		);
	});

	// render function
	function render() {
		const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
		for (let i = 0; i < STEPS_PER_FRAME; i++) {
			controls(deltaTime);
			updatePlayer(deltaTime);
			teleportPlayerIfOob();
			// update the picking ray with the camera and pointer position
			raycaster.setFromCamera(mouse, perspectiveCamera);
			// calculate objects intersecting the picking ray
			intersects = raycaster.intersectObjects(scene.children);
			House.animate_doors(deltaTime);
		}
		renderer.render(scene, cameras[cameraType]);
		requestAnimationFrame(render);
	}
}

main();