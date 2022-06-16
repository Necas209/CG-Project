import {House, PicketFence, PorchLight} from 'objects';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export class World {
	static add_ground(scene) {
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
		groundMesh.name = 'ground';
		groundMesh.castShadow = groundMesh.receiveShadow = true;
		groundMesh.rotateX(-Math.PI / 2);
		scene.add(groundMesh);
	}

	static add_house(scene) {
		House.add_front_wall(scene);
		House.add_back_wall(scene);
		House.add_left_wall(scene);
		House.add_right_wall(scene);
		House.add_right_front_wall(scene);
		House.add_right_left_wall(scene);
		House.add_inner_left_wall(scene);
		House.add_inner_right_wall(scene);
		House.add_pillar(scene);
		House.add_floor(scene);
		House.add_ceiling(scene);
		House.add_ceiling_lights(scene);
		House.add_roof(scene);
	}

	static add_porch_lights(scene) {
		const porchLightLeft = new PorchLight();
		porchLightLeft.rotateY(-Math.PI / 2);
		porchLightLeft.position.set(-4.4, 1.8, 0);
		scene.add(porchLightLeft);
		const porchLightRight = new PorchLight();
		porchLightRight.position.set(3.4, 1.8, 3.8);
		porchLightRight.rotateY(-Math.PI / 2);
		scene.add(porchLightRight);
		const porchLightFront = new PorchLight();
		porchLightFront.position.set(3.5, 1.8, 0.4);
		scene.add(porchLightFront);
		const porchLightBack = new PorchLight();
		porchLightBack.rotateY(Math.PI);
		porchLightBack.position.set(0.625, 1.8, -4.4);
		scene.add(porchLightBack);
	}

	static add_picket_fence(scene) {
		const fence = new PicketFence();
		fence.castShadow = fence.receiveShadow = true;
		// (-10, 0, -10) -> (-10, 0, 10)
		for (let i = 0; i < 14; i++) {
			const picketFence = fence.clone();
			picketFence.position.set(-10 + 1.5 * i, 0, -10);
			scene.add(picketFence);
		}
		// (-10, 0, -10) -> (-10, 0, 10)
		for (let i = 0; i < 14; i++) {
			const picketFence = fence.clone();
			picketFence.rotateY(Math.PI / 2);
			picketFence.position.set(-10, 0, -10 + 1.5 * i);
			scene.add(picketFence);
		}
		// (-10, 0, 10) -> (10, 0, 10)
		for (let i = 0; i < 14; i++) {
			if (i !== 7) {
				const picketFence = fence.clone();
				picketFence.position.set(-10 + 1.5 * i, 0, 10);
				scene.add(picketFence);
			}
		}
		// (10, 0, -10) -> (10, 0, 10)
		for (let i = 0; i < 14; i++) {
			const picketFence = fence.clone();
			picketFence.rotateY(Math.PI / 2);
			picketFence.position.set(10, 0, -10 + 1.5 * i);
			scene.add(picketFence);
		}
	}

	static add_trees(scene, worldOctree) {
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
			scene.add(trees);
			worldOctree.fromGraphNode(trees);
		});
	}
}