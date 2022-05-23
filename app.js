import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Octree } from 'three/examples/jsm/math/Octree';
import { Capsule } from 'three/examples/jsm/math/Capsule';

function main() {
	const clock = new THREE.Clock();

	const scene = new THREE.Scene();

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

	const playerCollider = new Capsule(new THREE.Vector3(-5, 0.35, -1), new THREE.Vector3(-5, 1, -1), 0.35);

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
			playerCollider.start.set(-5, 0.35, -1);
			playerCollider.end.set(-5, 1, -1);
			playerCollider.radius = 0.35;
			camera.position.copy(playerCollider.end);
			camera.rotation.set(0, 0, 0);
		}
	}

	// Ground
	const planeGeometry = new THREE.PlaneGeometry(3000, 3000);
	const tex_loader = new THREE.TextureLoader();
	const color_map = tex_loader.load('objects/creepy-house-gltf/textures/ground2_diffuse.png');
	color_map.wrapS = THREE.RepeatWrapping;
	color_map.wrapT = THREE.RepeatWrapping;
	color_map.repeat.set(10, 10);
	const material = new THREE.MeshPhysicalMaterial({
		map: color_map,
		aoMap: tex_loader.load('objects/creepy-house-gltf/textures/ground2_occlusion.png'),
		normalMap: tex_loader.load('objects/creepy-house-gltf/textures/ground2_normal.png'),
		specularColorMap: tex_loader.load('objects/creepy-house-gltf/textures/ground2_specularGlossiness.png'),
	});
	const ground = new THREE.Mesh(planeGeometry, material);
	ground.position.setY(-155);
	ground.rotateX(-Math.PI / 2);
	scene.add(ground);
				
	// Trees
	let tree = undefined;
	const gltf_loader = new GLTFLoader();
	gltf_loader.load('objects/pine_tree/scene.gltf', (gltf) => {
		scene.add(gltf.scene);
		gltf.scene.position.set(1000, -155, 1000);
		tree = gltf.scene;
		gltf.scene.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				if (child.material.map) {
					child.material.map.anisotropy = 4;
				}
			}
		});
	});
	
	// Creepy house
	gltf_loader.load('objects/creepy-house-gltf/scene.gltf', (gltf) => {
		gltf.scene.scale.set(0.02, 0.02, 0.02);
		scene.add(gltf.scene);
		gltf.scene.add(ground);
		gltf.scene.add(tree);
		worldOctree.fromGraphNode(gltf.scene);
		gltf.scene.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				if (child.material.map) {
					child.material.map.anisotropy = 4;
				}
			}
		});
	});
		
	// Ambient light
	const light = new THREE.AmbientLight(0xFFFFE0, 1);
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