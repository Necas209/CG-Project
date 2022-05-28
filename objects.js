import * as THREE from 'three';

export class Ellipse extends THREE.Curve {
	constructor(xRadius, yRadius) {
		super();
		this.xRadius = xRadius;
		this.yRadius = yRadius;
	}
	// eslint-disable-next-line no-unused-vars
	getPoint(t, optionalTarget) {
		const radians = 2 * Math.PI * t;
		// noinspection JSValidateTypes
		return new THREE.Vector3(this.xRadius * Math.cos(radians),
			this.yRadius * Math.sin(radians), 0);
	}
}

export class PicketFence extends THREE.Mesh {
	constructor() {
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
		// Fence geometry and material
		const fenceGeometry = new THREE.ExtrudeBufferGeometry(shape, { depth: 0 });
		const textureLoader = new THREE.TextureLoader();
		const colorMap = textureLoader.load('textures/fence/Wood033_1K_Color.png');
		colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
		colorMap.repeat.set(0.6, 0.6);
		const normalMap = textureLoader.load('textures/fence/Wood033_1K_NormalGL.png');
		normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
		normalMap.repeat.set(0.6, 0.6);
		const displacementMap = textureLoader.load('textures/fence/Wood033_1K_Displacement.png');
		displacementMap.wrapS = displacementMap.wrapT = THREE.RepeatWrapping;
		displacementMap.repeat.set(0.6, 0.6);
		const fenceMaterial = new THREE.MeshStandardMaterial({
			map: colorMap,
			aoMap: textureLoader.load('textures/fence/Wood033_1K_AmbientOcclusion.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/fence/Wood033_1K_Roughness.png'),
			displacementMap: displacementMap,
			displacementScale: 0
		});
		super(fenceGeometry, fenceMaterial);
		super.castShadow = super.receiveShadow = true;
	}
}

export class Ground extends THREE.Mesh {
	constructor() {
		const groundGeometry = new THREE.PlaneGeometry(50, 50);
		const textureLoader = new THREE.TextureLoader();
		let colorMap = textureLoader.load('textures/ground/Moss001_1K_Color.png');
		colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
		colorMap.repeat.set(10, 10);
		let normalMap = textureLoader.load('textures/ground/Moss001_1K_NormalGL.png');
		normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
		normalMap.repeat.set(10, 10);
		const groundMaterial = new THREE.MeshStandardMaterial({
			map: colorMap,
			aoMap: textureLoader.load('textures/ground/Moss001_1K_AmbientOcclusion.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/ground/Moss001_1K_Roughness.png'),
			displacementMap: textureLoader.load('textures/ground/Moss001_1K_Displacement.png'),
		});
		super(groundGeometry, groundMaterial);
		super.castShadow = super.receiveShadow = true;
		super.rotateX(-Math.PI / 2);
	}
}

export class PorchLight extends THREE.Group {
	constructor() {
		super();
		const textureLoader = new THREE.TextureLoader();
		const metalMaterial = new THREE.MeshStandardMaterial({
			map: textureLoader.load('textures/porch-lights/Metal027_1K_Color.png'),
			displacementMap: textureLoader.load('textures/porch-lights/Metal027_1K_Displacement.png'),
			metalnessMap: textureLoader.load('textures/porch-lights/Metal027_1K_Metalness.png'),
			normalMap: textureLoader.load('textures/porch-lights/Metal027_1K_NormalGL.png'),
			roughnessMap: textureLoader.load('textures/porch-lights/Metal027_1K_Roughness.png'),
			displacementScale: 0
		});
		// Base
		const baseGeometry = new THREE.BoxBufferGeometry(0.2, 0.05, 0.2);
		const baseMesh = new THREE.Mesh(baseGeometry, metalMaterial);
		super.add(baseMesh);
		// Sides
		const sideGeometry = new THREE.BoxBufferGeometry(0.02, 0.3, 0.02);
		const sidePos = [[-0.09, -0.09], [0.09, -0.09], [0.09, 0.09], [-0.09, 0.09]];
		sidePos.forEach((pos) => {
			const sideMesh = new THREE.Mesh(sideGeometry, metalMaterial);
			sideMesh.position.set(pos[0], 0.175, pos[1]);
			super.add(sideMesh);
		});
		// Glass Sides
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
		const glassGeometry = new THREE.BoxBufferGeometry(0.01, 0.3, 0.16);
		const glassPos = [[-0.09, 0], [0, -0.09], [0.09, 0], [0, 0.09]];
		glassPos.forEach((pos, i) => {
			const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
			glassMesh.position.set(pos[0], 0.175, pos[1]);
			glassMesh.rotateY(Math.PI / 2 * i);
			super.add(glassMesh);
		});
		// Top
		const topGeometry = new THREE.ConeBufferGeometry(0.15, 0.1, 4);
		const topMesh = new THREE.Mesh(topGeometry, metalMaterial);
		topMesh.position.set(0, 0.375, 0);
		topMesh.rotateY(Math.PI / 4);
		super.add(topMesh);
		// Hook
		const hookGeometry = new THREE.BoxBufferGeometry(0.2, 0.015, 0.015);
		const hookMesh = new THREE.Mesh(hookGeometry, metalMaterial);
		hookMesh.position.set(0.08, 0.61, 0);
		super.add(hookMesh);
		// Hook Base
		const hookBaseGeometry = new THREE.BoxBufferGeometry(0.02, 0.1, 0.1);
		const hookBaseMesh = new THREE.Mesh(hookBaseGeometry, metalMaterial);
		hookBaseMesh.position.set(0.19, 0.61, 0);
		super.add(hookBaseMesh);
		// Chain
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
		// Candle
		const candleGeometry = new THREE.CylinderBufferGeometry(0.05, 0.05, 0.2);
		const candleMaterial = new THREE.MeshStandardMaterial({ color: 0xfffff0 });
		const candleMesh = new THREE.Mesh(candleGeometry, candleMaterial);
		candleMesh.position.set(0, 0.125, 0);
		super.add(candleMesh);
		// Flame
		const candleLight = new THREE.PointLight(0xfbb741, 3, 100, 2);
		const flameGeometry = new THREE.ConeBufferGeometry(0.02, 0.06);
		const flameMaterial = new THREE.MeshStandardMaterial({
			emissive: 0xfbb741,
			emissiveIntensity: 1,
			color: 0x000000
		});
		candleLight.add(new THREE.Mesh(flameGeometry, flameMaterial));
		candleLight.position.set(0, 0.25, 0);
		super.add(candleLight);
		// Assure porch light casts and receives shadows
		super.traverse(child => { child.castShadow = child.receiveShadow = true; });
	}
}