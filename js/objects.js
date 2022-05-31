import * as THREE from 'three';

class Ellipse extends THREE.Curve {
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
		// Fence geometry and material
		const fenceGeometry = new THREE.ExtrudeBufferGeometry(shape, {depth: 0});
		const textureLoader = new THREE.TextureLoader();
		const colorMap = textureLoader.load('textures/fence/Wood033_1K_Color.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(0.6, 0.6);
		});
		const normalMap = textureLoader.load('textures/fence/Wood033_1K_NormalGL.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(0.6, 0.6);
		});
		const fenceMaterial = new THREE.MeshStandardMaterial({
			map: colorMap,
			aoMap: textureLoader.load('textures/fence/Wood033_1K_AmbientOcclusion.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/fence/Wood033_1K_Roughness.png'),
			displacementMap: textureLoader.load('textures/fence/Wood033_1K_Displacement.png'),
			displacementScale: 0
		});
		super(fenceGeometry, fenceMaterial);
		super.castShadow = super.receiveShadow = true;
	}
}

export class PorchLight extends THREE.Group {
	constructor() {
		super();
		const textureLoader = new THREE.TextureLoader();
		const metalMaterial = new THREE.MeshStandardMaterial({
			map: textureLoader.load('textures/porch-lights/Metal021_1K_Color.png'),
			displacementMap: textureLoader.load('textures/porch-lights/Metal021_1K_Displacement.png'),
			metalnessMap: textureLoader.load('textures/porch-lights/Metal021_1K_Metalness.png'),
			normalMap: textureLoader.load('textures/porch-lights/Metal021_1K_NormalGL.png'),
			roughnessMap: textureLoader.load('textures/porch-lights/Metal021_1K_Roughness.png'),
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
		const glassGeometry = new THREE.BoxBufferGeometry(0.01, 0.3, 0.16);
		const glassPos = [[-0.09, 0], [0, -0.09], [0.09, 0], [0, 0.09]];
		glassPos.forEach((pos, i) => {
			const glassMesh = new THREE.Mesh(glassGeometry, new GlassMaterial());
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
		chain.traverse((child) => {
			child.castShadow = child.receiveShadow = true;
		});
		super.add(chain);
		// Candle
		const candleGeometry = new THREE.CylinderBufferGeometry(0.05, 0.05, 0.2);
		const candleMaterial = new THREE.MeshStandardMaterial({color: 0xfffff0});
		const candleMesh = new THREE.Mesh(candleGeometry, candleMaterial);
		candleMesh.position.set(0, 0.125, 0);
		super.add(candleMesh);
		// Flame
		const candleLight = new THREE.PointLight(0xfbb741, 1, 100, 2);
		candleLight.power = 15;
		const flameGeometry = new THREE.ConeBufferGeometry(0.02, 0.06);
		const flameMaterial = new THREE.MeshStandardMaterial({
			emissive: 0xfbb741,
			emissiveIntensity: 2,
			color: 0x000000
		});
		candleLight.add(new THREE.Mesh(flameGeometry, flameMaterial));
		candleLight.position.set(0, 0.25, 0);
		super.add(candleLight);
		super.rotateY(Math.PI / 2);
		// Assure porch light casts and receives shadows
		super.traverse(child => {
			child.castShadow = child.receiveShadow = true;
		});
	}
}

class WoodMaterial extends THREE.MeshStandardMaterial {
	constructor() {
		const textureLoader = new THREE.TextureLoader();
		const map = textureLoader.load('textures/wall/WoodSiding001_1K_Color.png', (texture) => {
			texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
		});
		const normalMap = textureLoader.load('textures/wall/WoodSiding001_1K_NormalGL.png', (texture) => {
			texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
		});
		super({
			map: map,
			aoMap: textureLoader.load('textures/wall/WoodSiding001_1K_AmbientOcclusion.png'),
			displacementMap: textureLoader.load('textures/wall/WoodSiding001_1K_Displacement.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/wall/WoodSiding001_1K_Roughness.png'),
			displacementScale: 0
		});
	}
}

class GlassMaterial extends THREE.MeshPhysicalMaterial {
	constructor() {
		const textureLoader = new THREE.TextureLoader();
		super({
			map: textureLoader.load('textures/porch-lights/Facade001_1K_Color.png'),
			displacementMap: textureLoader.load('textures/porch-lights/Facade001_1K_Displacement.png'),
			metalnessMap: textureLoader.load('textures/porch-lights/Facade001_1K_Metalness.png'),
			normalMap: textureLoader.load('textures/porch-lights/Facade001_1K_NormalGL.png'),
			roughnessMap: textureLoader.load('textures/porch-lights/Facade001_1K_Roughness.png'),
			displacementScale: 0,
			transmission: 1
		});
	}
}

class LeftWall extends THREE.Group {
	constructor() {
		super();
		const wallShape = new THREE.Shape();
		wallShape.lineTo(8, 0);
		wallShape.lineTo(8, 3);
		wallShape.lineTo(0, 3);
		const leftWindowPath = new THREE.Path();
		leftWindowPath.moveTo(1, 1);
		leftWindowPath.lineTo(2.5, 1);
		leftWindowPath.lineTo(2.5, 2);
		leftWindowPath.lineTo(1, 2);
		wallShape.holes.push(leftWindowPath);
		const rightWindowPath = new THREE.Path();
		rightWindowPath.moveTo(5.5, 1);
		rightWindowPath.lineTo(7, 1);
		rightWindowPath.lineTo(7, 2);
		rightWindowPath.lineTo(5.5, 2);
		wallShape.holes.push(rightWindowPath);
		const wallGeometry = new THREE.ExtrudeBufferGeometry(wallShape, {depth: 0.01});
		const wallMesh = new THREE.Mesh(wallGeometry, new WoodMaterial());
		super.add(wallMesh);
		const leftWindow = new Window();
		leftWindow.position.set(1.75, 1.5, 0);
		super.add(leftWindow);
		const rightWindow = new Window();
		rightWindow.position.set(6.25, 1.5, 0);
		super.add(rightWindow);
		super.rotateY(Math.PI / 2);
		super.traverse((object) => {
			object.castShadow = object.receiveShadow = true;
		});
	}
}

class RightWall extends THREE.Group {
	constructor() {
		super();
		const wallShape = new THREE.Shape();
		wallShape.lineTo(4, 0);
		wallShape.lineTo(4, 3);
		wallShape.lineTo(0, 3);
		const windowPath = new THREE.Path();
		windowPath.moveTo(1.5, 1);
		windowPath.lineTo(3, 1);
		windowPath.lineTo(3, 2);
		windowPath.lineTo(1.5, 2);
		wallShape.holes.push(windowPath);
		const wallGeometry = new THREE.ExtrudeBufferGeometry(wallShape, {depth: 0.01});
		const wallMesh = new THREE.Mesh(wallGeometry, new WoodMaterial());
		super.add(wallMesh);
		const window = new Window();
		window.position.set(2.25, 1.5, 0);
		super.add(window);
		super.rotateY(Math.PI / 2);
		super.traverse((object) => {
			object.castShadow = object.receiveShadow = true;
		});
	}
}

class DoorStep extends THREE.Mesh {
	constructor() {
		const doorStepShape = new THREE.Shape();
		doorStepShape.lineTo(0.8, 0);
		doorStepShape.lineTo(0, 0.04);
		const doorStepGeometry = new THREE.ExtrudeBufferGeometry(doorStepShape, {depth: 0.5});
		super(doorStepGeometry, new WoodMaterial());
		super.rotateY(-Math.PI / 2);
	}
}

class RightLeftWall extends THREE.Mesh {
	constructor() {
		const wallShape = new THREE.Shape();
		wallShape.moveTo(0, 0);
		wallShape.lineTo(4, 0);
		wallShape.lineTo(4, 3);
		wallShape.lineTo(0, 3);
		wallShape.moveTo(0, 0);
		const wallGeometry = new THREE.ExtrudeBufferGeometry(wallShape, {depth: 0.01});
		super(wallGeometry, new WoodMaterial());
		super.rotateY(Math.PI / 2);
	}
}

class RightFrontWall extends THREE.Group {
	constructor() {
		super();
		const wallShape = new THREE.Shape();
		wallShape.lineTo(3, 0);
		wallShape.lineTo(3, 3);
		wallShape.lineTo(0, 3);
		const doorPath = new THREE.Path();
		doorPath.moveTo(1, 0);
		doorPath.lineTo(2, 0);
		doorPath.lineTo(2, 2.3);
		doorPath.lineTo(1, 2.3);
		wallShape.holes.push(doorPath);
		const wallGeometry = new THREE.ExtrudeBufferGeometry(wallShape, {depth: 0.01});
		const wallMesh = new THREE.Mesh(wallGeometry, new WoodMaterial());
		super.add(wallMesh);
		const door = new Door('front_door');
		door.position.set(2, 1.15, 0);
		super.add(door);
		super.traverse((object) => {
			object.castShadow = object.receiveShadow = true;
		});
	}
}

class BackWall extends THREE.Group {
	constructor() {
		super();
		const wallShape = new THREE.Shape();
		wallShape.moveTo(0, 0);
		wallShape.lineTo(8, 0);
		wallShape.lineTo(8, 3);
		wallShape.lineTo(0, 3);
		wallShape.lineTo(0, 0);
		const leftWindowPath = new THREE.Path();
		leftWindowPath.moveTo(1.75, 1);
		leftWindowPath.lineTo(3.25, 1);
		leftWindowPath.lineTo(3.25, 2);
		leftWindowPath.lineTo(1.75, 2);
		wallShape.holes.push(leftWindowPath);
		const rightWindowPath = new THREE.Path();
		rightWindowPath.moveTo(6, 1);
		rightWindowPath.lineTo(7, 1);
		rightWindowPath.lineTo(7, 2);
		rightWindowPath.lineTo(6, 2);
		wallShape.holes.push(rightWindowPath);
		const wallGeometry = new THREE.ExtrudeBufferGeometry(wallShape, {depth: 0.01});
		const wallMesh = new THREE.Mesh(wallGeometry, new WoodMaterial());
		super.add(wallMesh);
		const leftWindow = new Window();
		leftWindow.position.set(2.5, 1.5, 0);
		super.add(leftWindow);
		const rightWindow = new Window(1, 1);
		rightWindow.position.set(6.5, 1.5, 0);
		super.add(rightWindow);
		super.traverse(object => {
			object.castShadow = object.receiveShadow = true;
		});
	}
}

class FrontWall extends THREE.Group {
	constructor() {
		super();
		const frontWallShape = new THREE.Shape();
		frontWallShape.lineTo(5, 0);
		frontWallShape.lineTo(5, 3);
		frontWallShape.lineTo(0, 3);
		const windowPath = new THREE.Path();
		windowPath.moveTo(1.75, 1);
		windowPath.lineTo(3.25, 1);
		windowPath.lineTo(3.25, 2);
		windowPath.lineTo(1.75, 2);
		frontWallShape.holes.push(windowPath);
		const frontWallGeometry = new THREE.ExtrudeBufferGeometry(frontWallShape, {depth: 0.01});
		const frontWallMesh = new THREE.Mesh(frontWallGeometry, new WoodMaterial());
		super.add(frontWallMesh);
		const window = new Window();
		window.position.set(2.5, 1.5, 0);
		super.add(window);
		super.traverse((object) => {
			object.castShadow = object.receiveShadow = true;
		});
	}
}

class InnerLeftWall extends THREE.Group {
	constructor() {
		super();
		const wallShape = new THREE.Shape();
		wallShape.lineTo(5, 0);
		wallShape.lineTo(5, 3);
		wallShape.lineTo(0, 3);
		const doorPath = new THREE.Path();
		doorPath.moveTo(3, 0);
		doorPath.lineTo(4, 0);
		doorPath.lineTo(4, 2.3);
		doorPath.lineTo(3, 2.3);
		wallShape.holes.push(doorPath);
		const wallGeometry = new THREE.ExtrudeBufferGeometry(wallShape, {depth: 0.01});
		const wallMesh = new THREE.Mesh(wallGeometry, new WoodMaterial());
		super.add(wallMesh);
		super.traverse((object) => {
			object.castShadow = object.receiveShadow = true;
		});
	}
}

class InnerRightWall extends THREE.Group {
	constructor() {
		super();
		const wallShape = new THREE.Shape();
		wallShape.lineTo(4, 0);
		wallShape.lineTo(4, 3);
		wallShape.lineTo(0, 3);
		const doorPath = new THREE.Path();
		doorPath.moveTo(1.5, 0);
		doorPath.lineTo(2.5, 0);
		doorPath.lineTo(2.5, 2.3);
		doorPath.lineTo(1.5, 2.3);
		wallShape.holes.push(doorPath);
		const wallGeometry = new THREE.ExtrudeBufferGeometry(wallShape, {depth: 0.01});
		const wallMesh = new THREE.Mesh(wallGeometry, new WoodMaterial());
		super.add(wallMesh);
		super.rotateY(Math.PI / 2);
		super.traverse((object) => {
			object.castShadow = object.receiveShadow = true;
		});
	}
}

class Pillar extends THREE.Mesh {
	constructor() {
		const pillarShape = new THREE.Shape();
		pillarShape.lineTo(0.4, 0);
		pillarShape.lineTo(0.4, 3);
		pillarShape.lineTo(0, 3);
		const pillarGeometry = new THREE.ExtrudeBufferGeometry(pillarShape, {depth: 0.01});
		super(pillarGeometry, new WoodMaterial());
		super.rotateY(Math.PI / 2);
	}
}

class Floor extends THREE.Mesh {
	constructor() {
		const textureLoader = new THREE.TextureLoader();
		const map = textureLoader.load('textures/floor/Wood062_1K_Color.png', (texture) => {
			texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
		});
		const normalMap = textureLoader.load('textures/floor/Wood062_1K_NormalGL.png', (texture) => {
			texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
		});
		const floorMaterial = new THREE.MeshStandardMaterial({
			map: map,
			aoMap: textureLoader.load('textures/floor/Wood062_1K_AmbientOcclusion.png'),
			displacementMap: textureLoader.load('textures/floor/Wood062_1K_Displacement.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/floor/Wood062_1K_Roughness.png'),
			displacementScale: 0
		});
		const floorShape = new THREE.Shape();
		floorShape.lineTo(5, 0);
		floorShape.lineTo(5, 4);
		floorShape.lineTo(8, 4);
		floorShape.lineTo(8, 8);
		floorShape.lineTo(0, 8);
		const floorGeometry = new THREE.ExtrudeBufferGeometry(floorShape, {depth: 0.0001});
		super(floorGeometry, floorMaterial);
		super.rotateX(-Math.PI / 2);
	}
}

class Ceiling extends THREE.Mesh {
	constructor() {
		const ceilingShape = new THREE.Shape();
		ceilingShape.lineTo(8, 0);
		ceilingShape.lineTo(8, 8);
		ceilingShape.lineTo(0, 8);
		const floorGeometry = new THREE.ExtrudeBufferGeometry(ceilingShape, {depth: 0.0001});
		super(floorGeometry, new WoodMaterial());
		super.rotateX(-Math.PI / 2);
	}
}

class Roof extends THREE.Mesh {
	constructor() {
		const textureLoader = new THREE.TextureLoader();
		const map = textureLoader.load('textures/roof/RoofingTiles009_1K_Color.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(8, 5);
		});
		const normalMap = textureLoader.load('textures/roof/RoofingTiles009_1K_NormalGL.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(8, 5);
		});
		const roofMaterial = new THREE.MeshStandardMaterial({
			map: map,
			displacementMap: textureLoader.load('textures/roof/RoofingTiles009_1K_Displacement.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/roof/RoofingTiles009_1K_Roughness.png'),
			displacementScale: 0
		});
		const roofGeometry = new THREE.ConeBufferGeometry(4 * Math.sqrt(2), 3, 4);
		super(roofGeometry, roofMaterial);
		super.rotateY(Math.PI / 4);
	}
}

class Window extends THREE.Group {
	constructor(width=1.5, height=1) {
		super();
		const thickness = 0.2;
		const vFrameMesh = new THREE.Mesh(
			new THREE.BoxBufferGeometry(thickness, height, 0.1),
			new WoodMaterial()
		);
		super.add(vFrameMesh);
		[-(width + thickness) / 4, (width + thickness) / 4].forEach(x => {
			const hFrameMesh = new THREE.Mesh(
				new THREE.BoxBufferGeometry((width - thickness)/ 2, thickness, 0.1),
				new WoodMaterial()
			);
			hFrameMesh.position.setX(x);
			super.add(hFrameMesh);
		});
		const glassGeometry = new THREE.BoxBufferGeometry(
			(width - thickness) / 2,
			(height - thickness) / 2,
			0.1
		);
		const glassPos = [
			[0, 0],
			[(width + thickness) / 2, 0],
			[(width + thickness) / 2, (height + thickness) / 2],
			[0, (height + thickness) / 2]
		];
		glassPos.forEach(xy => {
			const glassMesh = new THREE.Mesh(glassGeometry, new GlassMaterial());
			glassMesh.position.set(
				xy[0] - (width + thickness) / 4,
				xy[1] - (height + thickness) / 4,
				0
			);
			super.add(glassMesh);
		});
	}
}

class Door extends THREE.Group {
	constructor(name) {
		super();
		super.name = name;
		const doorGeometry = new THREE.BoxBufferGeometry(1, 2.3, 0.1);
		const textureLoader = new THREE.TextureLoader();
		const colorMap = textureLoader.load('textures/fence/Wood033_1K_Color.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(0.6, 0.6);
		});
		const normalMap = textureLoader.load('textures/fence/Wood033_1K_NormalGL.png', (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(0.6, 0.6);
		});
		const material = new THREE.MeshStandardMaterial({
			map: colorMap,
			aoMap: textureLoader.load('textures/fence/Wood033_1K_AmbientOcclusion.png'),
			normalMap: normalMap,
			roughnessMap: textureLoader.load('textures/fence/Wood033_1K_Roughness.png'),
			displacementMap: textureLoader.load('textures/fence/Wood033_1K_Displacement.png'),
			displacementScale: 0
		});
		const doorMesh = new THREE.Mesh(doorGeometry, material);
		super.add(doorMesh);
	}
}

export class House extends THREE.Group {
	constructor() {
		super();
		// Door step
		const doorStep = new DoorStep();
		doorStep.position.set(2.75, 0.4, 0.2);
		super.add(doorStep);
		// Pillar
		const pillar = new Pillar();
		pillar.position.set(3.8, 0.5, 4);
		super.add(pillar);
		// Front Wall
		const frontWall = new FrontWall();
		frontWall.position.set(-4, 0.5, 4);
		super.add(frontWall);
		// Back wall
		const backWall = new BackWall();
		backWall.position.set(-4, 0.5, -4);
		super.add(backWall);
		// Left wall
		const leftWall = new LeftWall();
		leftWall.position.set(-4, 0.5, 4);
		super.add(leftWall);
		// Right Wall
		const rightWall = new RightWall();
		rightWall.position.set(4, 0.5, 0);
		super.add(rightWall);
		// Right front wall
		const rightFrontWall = new RightFrontWall();
		rightFrontWall.position.set(1, 0.5, 0);
		super.add(rightFrontWall);
		// Right left wall
		const rightLeftWall = new RightLeftWall();
		rightLeftWall.position.set(1, 0.5, 4);
		super.add(rightLeftWall);
		// Inner left wall
		const innerLeftWall = new InnerLeftWall();
		innerLeftWall.position.set(-4, 0.5, 0);
		super.add(innerLeftWall);
		// Inner right wall
		const innerRightWall = new InnerRightWall();
		innerRightWall.position.set(1, 0.5, 0);
		super.add(innerRightWall);
		// Floor
		const floor = new Floor();
		floor.position.set(-4, 0.3, 4);
		super.add(floor);
		// Ceiling
		const ceiling = new Ceiling();
		ceiling.position.set(-4, 3.7, 4);
		super.add(ceiling);
		// Roof
		const roof = new Roof();
		roof.position.setY(5.4);
		super.add(roof);
		// Cast and receive shadows
		super.traverse((object) => {
			object.castShadow = object.receiveShadow = true;
		});
	}
}
