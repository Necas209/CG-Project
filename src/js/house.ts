import * as THREE from "three";
import { GLTFLoader, Octree } from "three-stdlib";
import type { Interactable } from "./objects";
import { CeilingLight, Door, GlassWindow, LightSwitch } from "./objects";
import * as Materials from "./materials";

export class House {
    doors: Map<string, Door> = new Map();
    doorsOctree: Octree = new Octree();
    interactables: Map<string, Interactable> = new Map();

    constructor() { }

    build(doors: Door[], switches: LightSwitch[], doorsOctree: Octree) {
        this.doors = new Map(doors.map(d => [d.name, d]));
        this.interactables = new Map([...doors, ...switches].map(i => [i.name, i]));
        this.doorsOctree = doorsOctree;
    }

    animate_doors(deltaTime: number) {
        for (const door of this.doors.values()) {
            door.animate_door(deltaTime);
        }
    }

    check_interactions(intersects: THREE.Intersection<THREE.Object3D>[]) {
        if (intersects.length === 0) return;
        if (intersects[0].distance < 5) {
            console.log(intersects[0]);
            let name = intersects[0]?.object?.parent?.name;
            if (!name) return;
            const interactable = this.interactables.get(name);
            if (interactable) {
                interactable.interact();
            }
        }
    }

    updateWorldOctree(needsUpdate = false) {
        if (!needsUpdate) return;
        this.doorsOctree = new Octree();
        for (const door of this.doors.values()) {
            this.doorsOctree.fromGraphNode(door);
        }
    }
}

export class HouseBuilder {
    house: House = new House();
    scene: THREE.Scene;
    worldOctree: Octree;
    doorsOctree: Octree = new Octree();
    doors: Door[] = [];
    switches: LightSwitch[] = [];

    constructor(scene: THREE.Scene, worldOctree: Octree) {
        this.scene = scene;
        this.worldOctree = worldOctree;
    }

    withCeilingLights() {
        // Hall light
        const hallLight = new CeilingLight();
        hallLight.position.set(2.5, 3.3, -2);
        this.scene.add(hallLight);
        const hallSwitch = new LightSwitch('hall_switch', hallLight);
        hallSwitch.rotateZ(-Math.PI / 2);
        hallSwitch.position.set(1.22, 2, -1);

        // Living room light
        const livingRoomLight = new CeilingLight();
        livingRoomLight.position.set(-1.5, 3.3, -2);
        this.scene.add(livingRoomLight);
        const livingSwitch = new LightSwitch('living_switch', livingRoomLight);
        livingSwitch.rotateZ(Math.PI / 2);
        livingSwitch.position.set(0.78, 2, -1);

        // Bedroom light
        const bedroomLight = new CeilingLight();
        bedroomLight.position.set(-1.5, 3.3, 2);
        this.scene.add(bedroomLight);
        const bedroomSwitch = new LightSwitch('bedroom_switch', bedroomLight);
        bedroomSwitch.position.set(0.4, 2, 0.22);

        this.switches = [hallSwitch, livingSwitch, bedroomSwitch];
        for (let lightSwitch of this.switches) {
            this.scene.add(lightSwitch);
        }
        return this;
    }

    withDoors() {
        // Front door
        const frontDoor = new Door('front_door', this.house.updateWorldOctree);
        frontDoor.castShadow = frontDoor.receiveShadow = true;
        frontDoor.position.set(3.1, 1.65, 0);

        // Living room door
        const livingDoor = new Door('living_door', this.house.updateWorldOctree);
        livingDoor.castShadow = frontDoor.castShadow = true;
        livingDoor.rotateY(Math.PI / 2);
        livingDoor.position.set(1, 1.65, -2.6);

        // Bedroom door
        const bedroomDoor = new Door('bedroom_door', this.house.updateWorldOctree);
        bedroomDoor.castShadow = bedroomDoor.receiveShadow = true;
        bedroomDoor.rotation.y = Math.PI;
        bedroomDoor.position.set(-1.1, 1.65, 0);

        this.doors = [frontDoor, livingDoor, bedroomDoor];
        for (let door of this.doors) {
            this.scene.add(door);
            this.doorsOctree.fromGraphNode(door);
        }
        return this;
    }

    withFloor() {
        const textureLoader = new THREE.TextureLoader();
        const map = textureLoader.load('../assets/textures/floor/Wood062_1K_Color.png', (texture) => {
            texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
        });
        const normalMap = textureLoader.load('../assets/textures/floor/Wood062_1K_NormalGL.png', (texture) => {
            texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
        });
        const material = new THREE.MeshStandardMaterial({
            map: map,
            aoMap: textureLoader.load('../assets/textures/floor/Wood062_1K_AmbientOcclusion.png'),
            displacementMap: textureLoader.load('../assets/textures/floor/Wood062_1K_Displacement.png'),
            normalMap: normalMap,
            roughnessMap: textureLoader.load('../assets/textures/floor/Wood062_1K_Roughness.png'),
            displacementScale: 0
        });
        const shape = new THREE.Shape();
        shape.lineTo(5, 0);
        shape.lineTo(5, 4);
        shape.lineTo(8, 4);
        shape.lineTo(8, 8);
        shape.lineTo(0, 8);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.0001 });
        const floor = new THREE.Mesh(geometry, material);
        floor.castShadow = floor.receiveShadow = true;
        floor.rotateX(-Math.PI / 2);
        floor.position.set(-4, 0.3, 4);
        this.scene.add(floor);
        return this;
    }

    withCeiling() {
        const shape = new THREE.Shape();
        shape.lineTo(8, 0);
        shape.lineTo(8, 8);
        shape.lineTo(0, 8);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.0001 });
        const ceiling = new THREE.Mesh(geometry, Materials.Wall);
        ceiling.castShadow = ceiling.receiveShadow = true;
        ceiling.rotateX(-Math.PI / 2);
        ceiling.position.set(-4, 3.7, 4);
        this.scene.add(ceiling);
        return this;
    }

    withRoof() {
        const textureLoader = new THREE.TextureLoader();
        const map = textureLoader.load('../assets/textures/roof/RoofingTiles009_1K_Color.png', (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(8, 5);
        });
        const normalMap = textureLoader.load('../assets/textures/roof/RoofingTiles009_1K_NormalGL.png', (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(8, 5);
        });
        const material = new THREE.MeshStandardMaterial({
            map: map,
            displacementMap: textureLoader.load('../assets/textures/roof/RoofingTiles009_1K_Displacement.png'),
            normalMap: normalMap,
            roughnessMap: textureLoader.load('../assets/textures/roof/RoofingTiles009_1K_Roughness.png'),
            displacementScale: 0
        });
        const geometry = new THREE.ConeGeometry(4 * Math.sqrt(2), 3, 4);
        const roof = new THREE.Mesh(geometry, material);
        roof.castShadow = roof.receiveShadow = true;
        roof.rotateY(Math.PI / 4);
        roof.position.setY(5.4);
        this.scene.add(roof);
        return this;
    }

    withLeftWall() {
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
        const wallGeometry = new THREE.ExtrudeGeometry(wallShape, { depth: 0.01 });
        const wallMesh = new THREE.Mesh(wallGeometry, Materials.Wall);
        wallMesh.castShadow = wallMesh.receiveShadow = true;
        wallMesh.rotateY(Math.PI / 2);
        wallMesh.position.set(-4, 0.5, 4);
        this.scene.add(wallMesh);
        const leftWindow = new GlassWindow();
        leftWindow.castShadow = leftWindow.receiveShadow = true;
        leftWindow.rotateY(Math.PI / 2);
        leftWindow.position.set(-4, 2, -2.25);
        this.scene.add(leftWindow);
        const rightWindow = new GlassWindow();
        rightWindow.castShadow = rightWindow.receiveShadow = true;
        rightWindow.position.set(-4, 2, 2.25);
        rightWindow.rotateY(Math.PI / 2);
        this.scene.add(rightWindow);
        return this;
    }

    withRightWall() {
        const shape = new THREE.Shape();
        shape.lineTo(4, 0);
        shape.lineTo(4, 3);
        shape.lineTo(0, 3);
        const windowPath = new THREE.Path();
        windowPath.moveTo(1.5, 1);
        windowPath.lineTo(3, 1);
        windowPath.lineTo(3, 2);
        windowPath.lineTo(1.5, 2);
        shape.holes.push(windowPath);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.01 });
        const wall = new THREE.Mesh(geometry, Materials.Wall);
        wall.castShadow = wall.receiveShadow = true;
        wall.rotateY(Math.PI / 2);
        wall.position.set(4, 0.5, 0);
        this.scene.add(wall);
        const window = new GlassWindow();
        window.castShadow = window.receiveShadow = true;
        window.rotateY(Math.PI / 2);
        window.position.set(4, 2, -2.25);
        this.scene.add(window);
        return this;
    }

    withRightFrontWall() {
        const shape = new THREE.Shape();
        shape.lineTo(3, 0);
        shape.lineTo(3, 3);
        shape.lineTo(0, 3);
        const doorPath = new THREE.Path();
        doorPath.moveTo(0.9, 0);
        doorPath.lineTo(2.1, 0);
        doorPath.lineTo(2.1, 2.3);
        doorPath.lineTo(0.9, 2.3);
        shape.holes.push(doorPath);
        const wallGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.01 });
        const wall = new THREE.Mesh(wallGeometry, Materials.Wall);
        wall.castShadow = wall.receiveShadow = true;
        wall.position.set(1, 0.5, 0);
        this.scene.add(wall);
        return this;
    }

    withRightLeftWall() {
        const wallShape = new THREE.Shape();
        wallShape.moveTo(0, 0);
        wallShape.lineTo(4, 0);
        wallShape.lineTo(4, 3);
        wallShape.lineTo(0, 3);
        wallShape.moveTo(0, 0);
        const wallGeometry = new THREE.ExtrudeGeometry(wallShape, { depth: 0.01 });
        const wall = new THREE.Mesh(wallGeometry, Materials.Wall);
        wall.castShadow = wall.receiveShadow = true;
        wall.rotateY(Math.PI / 2);
        wall.position.set(1, 0.5, 4);
        this.scene.add(wall);
        return this;
    }

    withFrontWall() {
        const shape = new THREE.Shape();
        shape.lineTo(5, 0);
        shape.lineTo(5, 3);
        shape.lineTo(0, 3);
        const path = new THREE.Path();
        path.moveTo(1.75, 1);
        path.lineTo(3.25, 1);
        path.lineTo(3.25, 2);
        path.lineTo(1.75, 2);
        shape.holes.push(path);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.01 });
        const wallMesh = new THREE.Mesh(geometry, Materials.Wall);
        wallMesh.castShadow = wallMesh.receiveShadow = true;
        wallMesh.position.set(-4, 0.5, 4);
        this.scene.add(wallMesh);
        const window = new GlassWindow();
        window.castShadow = window.receiveShadow = true;
        window.position.set(-1.5, 2, 4);
        this.scene.add(window);
        const doorStepShape = new THREE.Shape();
        doorStepShape.lineTo(0.8, 0);
        doorStepShape.lineTo(0, 0.04);
        const doorStepGeometry = new THREE.ExtrudeGeometry(doorStepShape, { depth: 0.5 });
        const doorstep = new THREE.Mesh(doorStepGeometry, Materials.Wall);
        doorstep.castShadow = doorstep.receiveShadow = true;
        doorstep.rotateY(-Math.PI / 2);
        doorstep.position.set(2.75, 0.4, 0.2);
        this.scene.add(doorstep);
        return this;
    }

    withBackWall() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(8, 0);
        shape.lineTo(8, 3);
        shape.lineTo(0, 3);
        shape.lineTo(0, 0);
        const leftWindowPath = new THREE.Path();
        leftWindowPath.moveTo(1.75, 1);
        leftWindowPath.lineTo(3.25, 1);
        leftWindowPath.lineTo(3.25, 2);
        leftWindowPath.lineTo(1.75, 2);
        shape.holes.push(leftWindowPath);
        const rightWindowPath = new THREE.Path();
        rightWindowPath.moveTo(6, 1);
        rightWindowPath.lineTo(7, 1);
        rightWindowPath.lineTo(7, 2);
        rightWindowPath.lineTo(6, 2);
        shape.holes.push(rightWindowPath);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.01 });
        const wall = new THREE.Mesh(geometry, Materials.Wall);
        wall.castShadow = wall.receiveShadow = true;
        wall.position.set(-4, 0.5, -4);
        this.scene.add(wall);
        const leftWindow = new GlassWindow();
        leftWindow.castShadow = leftWindow.receiveShadow = true;
        leftWindow.position.set(-1.5, 2, -4);
        this.scene.add(leftWindow);
        const rightWindow = new GlassWindow(1.0, 1.0);
        rightWindow.castShadow = rightWindow.receiveShadow = true;
        rightWindow.position.set(2.5, 2, -4);
        this.scene.add(rightWindow);
        return this;
    }

    withInnerLeftWall() {
        const shape = new THREE.Shape();
        shape.lineTo(5, 0);
        shape.lineTo(5, 3);
        shape.lineTo(0, 3);
        const path = new THREE.Path();
        path.moveTo(2.9, 0);
        path.lineTo(4.1, 0);
        path.lineTo(4.1, 2.3);
        path.lineTo(2.9, 2.3);
        shape.holes.push(path);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.01 });
        const wall = new THREE.Mesh(geometry, Materials.Wall);
        wall.castShadow = wall.receiveShadow = true;
        wall.position.set(-4, 0.5, 0);
        this.scene.add(wall);
        return this;
    }

    withInnerRightWall() {
        const shape = new THREE.Shape();
        shape.lineTo(4, 0);
        shape.lineTo(4, 3);
        shape.lineTo(0, 3);
        const path = new THREE.Path();
        path.moveTo(1.4, 0);
        path.lineTo(2.6, 0);
        path.lineTo(2.6, 2.3);
        path.lineTo(1.4, 2.3);
        shape.holes.push(path);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.01 });
        const wall = new THREE.Mesh(geometry, Materials.Wall);
        wall.castShadow = wall.receiveShadow = true;
        wall.rotateY(Math.PI / 2);
        wall.position.set(1, 0.5, 0);
        this.scene.add(wall);
        return this;
    }

    withPillar() {
        const shape = new THREE.Shape();
        shape.lineTo(0.4, 0);
        shape.lineTo(0.4, 3);
        shape.lineTo(0, 3);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.01 });
        const pillar = new THREE.Mesh(geometry, Materials.Wall);
        pillar.castShadow = pillar.receiveShadow = true;
        pillar.rotateY(Math.PI / 2);
        pillar.position.set(3.8, 0.5, 4);
        this.scene.add(pillar);
        return this;
    }

    withWalls() {
        this.withLeftWall()
            .withRightWall()
            .withRightFrontWall()
            .withRightLeftWall()
            .withFrontWall()
            .withBackWall()
            .withInnerLeftWall()
            .withInnerRightWall()
            .withPillar();
        return this;
    }

    withFurniture() {
        const loader = new GLTFLoader();
        loader.load('../assets/objects/table_chairs/scene.gltf', gltf => {
            const table = gltf.scene;
            table.scale.set(0.012, 0.012, 0.012);
            table.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = child.receiveShadow = true;
                }
            });
            table.position.set(-2, 0.55, -2);
            this.scene.add(table);
            this.worldOctree.fromGraphNode(table);
        });
        loader.load('../assets/objects/carpet/scene.gltf', gltf => {
            const carpet = gltf.scene;
            carpet.scale.set(2, 2, 2);
            carpet.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = child.receiveShadow = true;
                }
            });
            carpet.position.set(-2, 0.5, -2);
            this.scene.add(carpet);
            this.worldOctree.fromGraphNode(carpet);
        });
        loader.load('../assets/objects/bed/scene.gltf', gltf => {
            const bed = gltf.scene;
            bed.rotateY(Math.PI / 2);
            bed.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = child.receiveShadow = true;
                }
            });
            bed.position.set(-2.7, 0.55, 2);
            this.scene.add(bed);
            this.worldOctree.fromGraphNode(bed);
        });
        loader.load('../assets/objects/wardrobe/scene.gltf', gltf => {
            const wardrobe = gltf.scene;
            wardrobe.rotateY(-Math.PI / 2);
            wardrobe.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = child.receiveShadow = true;
                }
            });
            wardrobe.position.set(-0.6, 0.6, 2);
            this.scene.add(wardrobe);
            this.worldOctree.fromGraphNode(wardrobe);
        });
        return this;
    }

    build() {
        this.withFloor()
            .withCeiling()
            .withRoof()
            .withWalls()
            .withCeilingLights()
            .withFurniture();
        this.worldOctree.fromGraphNode(this.scene);
        this.withDoors();
        this.house.build(this.doors, this.switches, this.doorsOctree);
        return this.house;
    }
}