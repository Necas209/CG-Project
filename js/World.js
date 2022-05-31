import { House, PicketFence, PorchLight } from 'objects';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export class World extends THREE.Group {
	constructor() {
		super();
		this.mixer = new THREE.AnimationMixer(new THREE.Object3D());
	}

	add_ground() {
		const groundGeometry = new THREE.PlaneGeometry(50, 50);
		const textureLoader = new THREE.TextureLoader();
		let colorMap = textureLoader.load('textures/ground/Moss001_1K_Color.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(10, 10);
		});
		let normalMap = textureLoader.load('textures/ground/Moss001_1K_NormalGL.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(10, 10);
		});
		const groundMaterial = new THREE.MeshStandardMaterial({
			map: colorMap,
			aoMap: textureLoader.load('textures/ground/Moss001_1K_AmbientOcclusion.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/ground/Moss001_1K_Roughness.png'),
			displacementMap: textureLoader.load('textures/ground/Moss001_1K_Displacement.png'),
		});
		const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
		groundMesh.castShadow = super.receiveShadow = true;
		groundMesh.rotateX(-Math.PI / 2);
		super.add(groundMesh);
	}

	add_house() {
		const house = new House();
		const porchLightLeft = new PorchLight();
		porchLightLeft.rotateY(-Math.PI / 2);
		porchLightLeft.position.set(-4.4, 1.8, 0);
		house.add(porchLightLeft);
		const porchLightRight = new PorchLight();
		porchLightRight.position.set(3.4, 1.8, 3.8);
		porchLightRight.rotateY(-Math.PI / 2);
		house.add(porchLightRight);
		const porchLightFront = new PorchLight();
		porchLightFront.position.set(3.5, 1.8, 0.4);
		house.add(porchLightFront);
		const porchLightBack = new PorchLight();
		porchLightBack.rotateY(Math.PI);
		porchLightBack.position.set(0.625, 1.8, -4.4);
		house.add(porchLightBack);
		super.add(house);
	}

	add_picket_fence() {
		const fences = new THREE.Group();
		// (-10, 0, -10) -> (-10, 0, 10)
		for (let i = 0; i < 14; i++) {
			const picketFence = new PicketFence();
			picketFence.position.set(-10 + 1.5 * i, 0, -10);
			fences.add(picketFence);
		}
		// (-10, 0, -10) -> (-10, 0, 10)
		for (let i = 0; i < 14; i++) {
			const picketFence = new PicketFence();
			picketFence.rotateY(Math.PI / 2);
			picketFence.position.set(-10, 0, -10 + 1.5 * i);
			fences.add(picketFence);
		}
		// (-10, 0, 10) -> (10, 0, 10)
		for (let i = 0; i < 14; i++) {
			if (i !== 7) {
				const picketFence = new PicketFence();
				picketFence.position.set(-10 + 1.5 * i, 0, 10);
				fences.add(picketFence);
			}
		}
		// (10, 0, -10) -> (10, 0, 10)
		for (let i = 0; i < 14; i++) {
			const picketFence = new PicketFence();
			picketFence.rotateY(Math.PI / 2);
			picketFence.position.set(10, 0, -10 + 1.5 * i);
			fences.add(picketFence);
		}
		fences.traverse((object) => {
			object.castShadow = object.receiveShadow = true;
		});
		super.add(fences);
	}

	add_trees(worldOctree) {
		const treePositions = [
			[15, 0, -15], [13, 0, -9], [18, 0, -1],
			[14.5, 0, 1], [13.5, 0, 10], [15, 0, 18],
			[8, 0, 13.5], [-1, 0, 17], [-5, 0, 15],
			[-13, 0, 15], [-17, 0, 6], [-15, 0, 4],
			[-14, 0, -1], [-11, 0, -15], [-13.5, 0, -13],
			[-10, 0, -17], [-6, 0, -13], [0, 0, -13.5],
			[1, 0, -15], [8, 0, -14]
		];
		const gltfLoader = new GLTFLoader();
		gltfLoader.load('objects/pine_tree/scene.gltf', (gltf) => {
			gltf.scene.scale.set(0.04, 0.04, 0.04);
			gltf.scene.traverse(child => {
				if (child instanceof THREE.Mesh) {
					child.castShadow = child.receiveShadow = true;
				}
			});
			const trees = new THREE.Group();
			for (let i = 0; i < 20; i++) {
				const tree = gltf.scene.clone();
				tree.position.set(treePositions[i][0], treePositions[i][1], treePositions[i][2]);
				trees.add(tree);
			}
			super.add(trees);
			worldOctree.fromGraphNode(this);
		});
	}
	update_animations(deltaTime) {
		this.mixer.update(deltaTime);
	}
}