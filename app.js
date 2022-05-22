import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

import { Octree } from './js/math/Octree';
import { Capsule } from './js/math/Capsule';

function main() {
	const scene = new THREE.Scene();

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

	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	camera.position.set(0, 2, 2);

	const renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);

	const menuPanel = document.getElementById('menuPanel');
	const startButton = document.getElementById('startButton');
	startButton.addEventListener(
		'click',
		function () {
			controls.lock();
		},
		false
	);

	const controls = new PointerLockControls(camera, renderer.domElement);
	controls.addEventListener('lock', () => (menuPanel.style.display = 'none'));
	controls.addEventListener('unlock', () => (menuPanel.style.display = 'block'));

	const planeGeometry = new THREE.PlaneGeometry(100, 100);

	const tex_loader = new THREE.TextureLoader();

	const color_map = tex_loader.load('textures/ground/Ground037_1K_Color.png');
	color_map.wrapS = THREE.RepeatWrapping;
	color_map.wrapT = THREE.RepeatWrapping;
	color_map.repeat.set(10, 10);

	const material = new THREE.MeshStandardMaterial({
		map: color_map,
	});

	const plane = new THREE.Mesh(planeGeometry, material);
	plane.rotateX(-Math.PI / 2);
	// plane.position.set(10, 0, -5);
	scene.add(plane);

	const gltf_loader = new GLTFLoader();
	gltf_loader.load(
		'creepy-house-diorama/scene.gltf',
		(object) => {
			object.scene.traverse(function (child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
			object.scene.rotateY(Math.PI);
			object.scene.position.y = 0.7;
			scene.add(object.scene);
		}
	);

	{
		const light = new THREE.AmbientLight(0xFFFFE0, 1);
		scene.add(light);
	}

	renderer.physicallyCorrectLights = true;
	renderer.render(scene, camera);

	document.addEventListener('keydown', (ev) => {
		switch (ev.key) {
			case 'W':
			case 'ArrowUp':
				controls.moveForward(0.50);
				break;
			case 'A':
			case 'ArrowLeft':
				controls.moveRight(-0.50);
				break;
			case 'S':
			case 'ArrowDown':
				controls.moveForward(-0.50);
				break;
			case 'D':
			case 'ArrowRight':
				controls.moveRight(0.50);
				break;
		}
	}, true);

	window.addEventListener('resize', onWindowResize, false);
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();
	}

	function render() {
		// Update render
		renderer.render(scene, camera);
		// Callback
		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}

main();