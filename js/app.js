import * as THREE from 'three';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls';
import {Octree} from 'three/examples/jsm/math/Octree';
import {Capsule} from 'three/examples/jsm/math/Capsule';
import {World} from 'World';
import {House} from 'objects';


function main() {
	// Clock and scene
	const clock = new THREE.Clock();
	const scene = new THREE.Scene();
	// Axes helper - for position setting (remove for !release)
	const axesHelper = new THREE.AxesHelper(5);
	axesHelper.position.setY(8);
	scene.add(axesHelper);
	// Player constants
	const GRAVITY = 10;
	const STEPS_PER_FRAME = 5;
	// World octree - for collisions
	const worldOctree = new Octree();
	// Player variables
	const playerCollider = new Capsule(new THREE.Vector3(3, 0.8, 2), new THREE.Vector3(3, 2.5, 2), 0.2);
	const playerVelocity = new THREE.Vector3();
	const playerDirection = new THREE.Vector3();
	let playerOnFloor = false;
	// Perspective camera
	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	// Add flashlight to camera
	const spotLight = new THREE.SpotLight(0xffffff, 0);
	spotLight.angle = Math.PI * 0.2;
	spotLight.power = 0; // Default: Off
	spotLight.decay = 2;
	camera.add(spotLight);
	camera.add(spotLight.target);
	spotLight.target.position.set(0, 0.5, -0.5);
	scene.add(camera);
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
	const pl_controls = new PointerLockControls(camera, renderer.domElement);
	pl_controls.addEventListener('lock', () => (menuPanel.style.display = 'none'));
	pl_controls.addEventListener('unlock', () => (menuPanel.style.display = 'block'));
	startButton.addEventListener('click', () => {
		pl_controls.lock();
	}, false);
	// Turn on/off flashlight
	document.addEventListener('keypress', (event) => {
		if (event.code === 'KeyF') {
			spotLight.power = (spotLight.power > 0) ? 0 : 20;
		}
	});
	// Player controls and helper functions
	const keyStates = {};
	document.addEventListener('keydown', (event) => {
		keyStates[event.code] = true;
	});
	document.addEventListener('keyup', (event) => {
		keyStates[event.code] = false;
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
		if (camera.position.y <= -5) {
			playerCollider.start.set(0, 0.5, 10);
			playerCollider.end.set(0, 2, 10);
			playerCollider.radius = 0.35;
			camera.position.copy(playerCollider.end);
			camera.rotation.set(0, 0, 0);
		}
	}

	// World objects
	World.add_ground(scene);
	World.add_house(scene);
	World.add_picket_fence(scene);
	World.add_porch_lights(scene);
	// World.add_trees(scene, worldOctree);
	worldOctree.fromGraphNode(scene);
	House.add_doors(scene);
	// Ambient light
	const light = new THREE.AmbientLight(0xFFFFE0, 1.5);
	scene.add(light);
	// Background - Night Sky
	const backgroundLoader = new THREE.CubeTextureLoader();
	backgroundLoader.load([
		'textures/background/pos-x.png',
		'textures/background/neg-x.png',
		'textures/background/pos-y.png',
		'textures/background/neg-y.png',
		'textures/background/pos-z.png',
		'textures/background/neg-z.png',
	], (texture) => {
		scene.background = texture;
	});

	// check for window resize
	window.addEventListener('resize', onWindowResize, false);

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();
	}

	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	let intersects = [];
	document.addEventListener('keypress', event => {
		if (event.code === 'KeyE') {
			House.check_doors(intersects);
		}
	});

	// render function
	function render() {
		const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
		for (let i = 0; i < STEPS_PER_FRAME; i++) {
			controls(deltaTime);
			updatePlayer(deltaTime);
			teleportPlayerIfOob();
			// update the picking ray with the camera and pointer position
			raycaster.setFromCamera(pointer, camera);
			// calculate objects intersecting the picking ray
			intersects = raycaster.intersectObjects(scene.children, true);
			House.animate_doors(deltaTime);
		}
		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}
}

main();