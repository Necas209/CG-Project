import * as THREE from 'three';

export class PorchLight extends THREE.Group {
	constructor() {
		super();
		// Porch lights
		const textureLoader = new THREE.TextureLoader();

		const metalMaterial = new THREE.MeshStandardMaterial({
			map: textureLoader.load('textures/porch-lights/Metal027_1K_Color.png'),
			displacementMap: textureLoader.load('textures/porch-lights/Metal027_1K_Displacement.png'),
			metalnessMap: textureLoader.load('textures/porch-lights/Metal027_1K_Metalness.png'),
			normalMap: textureLoader.load('textures/porch-lights/Metal027_1K_NormalGL.png'),
			roughnessMap: textureLoader.load('textures/porch-lights/Metal027_1K_Roughness.png'),
			displacementScale: 0
		});
		const baseGeometry = new THREE.BoxBufferGeometry(0.2, 0.05, 0.2);
		const baseMesh = new THREE.Mesh(baseGeometry, metalMaterial);
		super.add(baseMesh);

		const sideGeometry = new THREE.BoxBufferGeometry(0.02, 0.3, 0.02);
		const sidePos = [[-0.09, -0.09], [0.09, -0.09], [0.09, 0.09], [-0.09, 0.09]];
		sidePos.forEach((pos) => {
			const sideMesh = new THREE.Mesh(sideGeometry, metalMaterial);
			sideMesh.position.set(pos[0], 0.175, pos[1]);
			super.add(sideMesh);
		});

		const glassMaterial = new THREE.MeshStandardMaterial({
			map: textureLoader.load('textures/porch-lights/Facade001_1K_Color.png'),
			displacementMap: textureLoader.load('textures/porch-lights/Facade001_1K_Displacement.png'),
			metalnessMap: textureLoader.load('textures/porch-lights/Facade001_1K_Metalness.png'),
			normalMap: textureLoader.load('textures/porch-lights/Facade001_1K_NormalGL.png'),
			roughnessMap: textureLoader.load('textures/porch-lights/Facade001_1K_Roughness.png'),
			displacementScale: 0,
			opacity: 0.3,
			transparent: true,
		});
		const sideGlassGeometry = new THREE.BoxBufferGeometry(0.01, 0.3, 0.16);
		const sideGlassPos = [[-0.09, 0], [0, -0.09], [0.09, 0], [0, 0.09]];
		sideGlassPos.forEach((pos, i) => {
			const sideGlassMesh = new THREE.Mesh(sideGlassGeometry, glassMaterial);
			sideGlassMesh.position.set(pos[0], 0.175, pos[1]);
			sideGlassMesh.rotateY(Math.PI / 2 * i);
			super.add(sideGlassMesh);
		});

		const topGeometry = new THREE.ConeBufferGeometry(0.15, 0.1, 4);
		const topMesh = new THREE.Mesh(topGeometry, metalMaterial);
		topMesh.position.set(0, 0.375, 0);
		topMesh.rotateY(Math.PI / 4);
		super.add(topMesh);

		const hookGeometry = new THREE.BoxBufferGeometry(0.2, 0.015, 0.015);
		const hookMesh = new THREE.Mesh(hookGeometry, metalMaterial);
		hookMesh.position.set(0.08, 0.61, 0);
		super.add(hookMesh);

		const hookBaseGeometry = new THREE.BoxBufferGeometry(0.02, 0.1, 0.1);
		const hookBaseMesh = new THREE.Mesh(hookBaseGeometry, metalMaterial);
		hookBaseMesh.position.set(0.19, 0.61, 0);
		super.add(hookBaseMesh);

		class Ellipse extends THREE.Curve {
			constructor(xRadius, yRadius) {
				super();
				this.xRadius = xRadius;
				this.yRadius = yRadius;
			}
			getPoint(t) {
				var radians = 2 * Math.PI * t;
				return new THREE.Vector3(this.xRadius * Math.cos(radians), this.yRadius * Math.sin(radians), 0);
			}
		}
		const ringPath = new Ellipse(0.015, 0.03);
		const ringGeometry = new THREE.TubeBufferGeometry(ringPath, 64, 0.005, 16, true);
		const chain = new THREE.Group();
		for (let i = 0; i < 4; i++) {
			const ringMesh = new THREE.Mesh(ringGeometry, metalMaterial);
			ringMesh.rotateY(Math.PI / 2 * i);
			ringMesh.position.set(0, i * 0.05, 0);
			chain.add(ringMesh);
		}
		chain.position.set(0, 0.435, 0);
		chain.traverse((child) => { child.castShadow = child.receiveShadow = true; });
		super.add(chain);

		const candleGeometry = new THREE.CylinderBufferGeometry(0.05, 0.05, 0.2);
		const candleMaterial = new THREE.MeshStandardMaterial({ color: 0xfffff0 });
		const candleMesh = new THREE.Mesh(candleGeometry, candleMaterial);
		candleMesh.position.set(0, 0.125, 0);
		super.add(candleMesh);

		const candleLight = new THREE.PointLight(0xfbb741, 2, 100, 2);
		const bulbGeometry = new THREE.ConeBufferGeometry(0.02, 0.06);
		const bulbMat = new THREE.MeshStandardMaterial({
			emissive: 0xfbb741,
			emissiveIntensity: 1,
			color: 0x000000
		});
		candleLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
		candleLight.position.set(0, 0.25, 0);
		super.add(candleLight);

		super.traverse(child => { child.castShadow = child.receiveShadow = true; });
	}
}