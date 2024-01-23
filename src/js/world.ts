import * as THREE from 'three';
import { PointerLockControls, GLTFLoader, Octree, Capsule } from "three-stdlib";
import { Flashlight, NPC, PicketFence, PorchLight } from "./assets/objects";
import type { House } from "../house";
import { HouseBuilder } from "../house";

export class World {
    static GRAVITY = -9.81;
    static STEPS_PER_FRAME = 5;
    house: House;
    scene: THREE.Scene;
    octree: Octree;
    mouse: THREE.Vector2;
    clock: THREE.Clock;
    raycaster: THREE.Raycaster;
    playerCollider: Capsule;
    playerVelocity: THREE.Vector3;
    playerDirection: THREE.Vector3;
    playerOnFloor: boolean;
    perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    orthographicCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
        window.innerWidth / -50,
        window.innerWidth / 50,
        window.innerHeight / 50,
        window.innerHeight / -50,
        -100,
        1000
    );
    isPerspectiveCamera: boolean = true;
    flashlight: Flashlight = new Flashlight();
    renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
    keyStates: Set<string> = new Set();
    intersects: any;

    constructor(house: House, scene: THREE.Scene, octree: Octree) {
        this.house = house;
        this.scene = scene;
        this.octree = octree;
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.playerCollider = new Capsule(
            new THREE.Vector3(3, 0.8, 2),
            new THREE.Vector3(3, 2.5, 2),
            0.2
        );
        this.playerVelocity = new THREE.Vector3();
        this.playerDirection = new THREE.Vector3();
        this.playerOnFloor = false;
        this.render = this.render.bind(this);
    }

    init() {
        // Cameras
        this.orthographicCamera.zoom = 2;

        // NPC
        const npc = new NPC();
        npc.position.set(0, -0.5, 0.5);
        this.perspectiveCamera.add(npc);

        // Flashlight
        this.flashlight.position.setY(-0.4);
        this.flashlight.target.position.set(0, -0.4, -2);
        this.perspectiveCamera.add(this.flashlight);
        this.perspectiveCamera.add(this.flashlight.target);
        this.scene.add(this.perspectiveCamera);

        // Renderer
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.useLegacyLights = true;
        document.body.appendChild(this.renderer.domElement);

        const menuPanel = document.getElementById('menuPanel');
        const startButton = document.getElementById('startButton');
        if (!menuPanel || !startButton) {
            throw new Error('Could not find menuPanel or startButton');
        }
        let pl_controls = new PointerLockControls(this.perspectiveCamera, this.renderer.domElement);
        pl_controls.addEventListener('lock', () => menuPanel.style.display = 'none');
        pl_controls.addEventListener('unlock', () => menuPanel.style.display = 'block');
        startButton.addEventListener('click', () => pl_controls.lock(), false);

        // Player controls and helper functions
        window.addEventListener('resize', this.resizeWindow.bind(this), false);
        document.addEventListener('keydown', event => this.keyStates.add(event.code));
        document.addEventListener('keyup', event => this.keyStates.delete(event.code));
        document.addEventListener('keypress', this.keyPress.bind(this));
        document.addEventListener('mousemove', event => {
            this.mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );
        });
    }

    render() {
        const deltaTime = Math.min(0.05, this.clock.getDelta()) / World.STEPS_PER_FRAME;
        for (let i = 0; i < World.STEPS_PER_FRAME; i++) {
            this.controls(deltaTime);
            this.updatePlayer(deltaTime);
            this.teleportPlayerIfOob();
            // update the picking ray with the camera and pointer position
            this.raycaster.setFromCamera(this.mouse, this.perspectiveCamera);
            this.intersects = this.raycaster.intersectassets/objects([...this.house.interactables.values()], true);
            this.house.animate_doors(deltaTime);
        }
        this.renderer.render(this.scene, this.getCurrentCamera());
        requestAnimationFrame(this.render);
    }

    resizeWindow() {
        const camera = this.getCurrentCamera();
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = window.innerWidth / window.innerHeight;
        }
        camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.render();
    }

    getCurrentCamera() {
        return this.isPerspectiveCamera
            ? this.perspectiveCamera
            : this.orthographicCamera;
    }

    /** @param {KeyboardEvent} event */
    keyPress(event: KeyboardEvent) {
        switch (event.code) {
            case 'KeyF':
                this.flashlight.turn_on_off();
                break;
            case 'KeyC':
                this.isPerspectiveCamera = !this.isPerspectiveCamera;
                break;
            case 'KeyE':
                this.house.check_interactions(this.intersects);
                break;
        }
    }

    playerCollisions() {
        const doorCollided = this.house.doorsOctree.capsuleIntersect(this.playerCollider);
        const worldCollided = doorCollided === false
            ? this.octree.capsuleIntersect(this.playerCollider)
            : doorCollided;
        this.playerOnFloor = false;
        if (!worldCollided) {
            return;
        }
        this.playerOnFloor = worldCollided.normal.y === 1;
        if (!this.playerOnFloor) {
            this.playerVelocity.addScaledVector(
                worldCollided.normal,
                -worldCollided.normal.dot(this.playerVelocity)
            );
        }

        const v = worldCollided.normal.multiplyScalar(worldCollided.depth);
        this.playerCollider.translate(v);
    }

    updatePlayer(deltaTime: number) {
        let damping = Math.exp(-4 * deltaTime) - 1;
        if (!this.playerOnFloor) {
            this.playerVelocity.y += World.GRAVITY * deltaTime;
            // small air resistance
            damping *= 0.1;
        }
        this.playerVelocity.addScaledVector(this.playerVelocity, damping);
        const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime);
        this.playerCollider.translate(deltaPosition);
        this.playerCollisions();
        this.perspectiveCamera.position.copy(this.playerCollider.end);
        const pos = this.playerCollider.end;
        this.orthographicCamera.position.set(pos.x + 1, pos.y, pos.z + 2);
        this.orthographicCamera.lookAt(this.playerCollider.start);
    }

    getForwardVector() {
        this.perspectiveCamera.getWorldDirection(this.playerDirection);
        this.playerDirection.y = 0;
        this.playerDirection.normalize();
        return this.playerDirection;
    }

    getSideVector() {
        this.perspectiveCamera.getWorldDirection(this.playerDirection);
        this.playerDirection.y = 0;
        this.playerDirection.normalize();
        this.playerDirection.cross(this.perspectiveCamera.up);
        return this.playerDirection;
    }

    controls(deltaTime: number) {
        // gives a bit of air control
        const speedDelta = deltaTime * (this.playerOnFloor ? 15 : 8);
        if (this.keyStates.has('KeyW')) {
            this.playerVelocity.add(this.getForwardVector().multiplyScalar(speedDelta));
        }
        if (this.keyStates.has('KeyS')) {
            this.playerVelocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
        }
        if (this.keyStates.has('KeyA')) {
            this.playerVelocity.add(this.getSideVector().multiplyScalar(-speedDelta));
        }
        if (this.keyStates.has('KeyD')) {
            this.playerVelocity.add(this.getSideVector().multiplyScalar(speedDelta));
        }
        if (this.keyStates.has('Space') && this.playerOnFloor) {
            console.log('jump');
            this.playerVelocity.y = 5;
        }
    }

    teleportPlayerIfOob() {
        if (this.perspectiveCamera.position.y > -5) {
            return;
        }
        this.playerCollider.start.set(0, 0.5, 10);
        this.playerCollider.end.set(0, 2, 10);
        this.playerCollider.radius = 0.35;
        this.perspectiveCamera.position.copy(this.playerCollider.end);
        this.perspectiveCamera.rotation.set(0, 0, 0);
    }
}

export class WorldBuilder {
    scene: THREE.Scene = new THREE.Scene();
    octree: Octree = new Octree();
    house: House | undefined;

    withGround() {
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const textureLoader = new THREE.TextureLoader();
        let colorMap = textureLoader.load(
            'assets/textures/ground/Moss001_1K_Color.png',
            (texture) => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(10, 10);
            });
        let normalMap = textureLoader.load(
            'assets/textures/ground/Moss001_1K_NormalGL.png',
            (texture) => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(10, 10);
            });
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: colorMap,
            aoMap: textureLoader.load('assets/textures/ground/Moss001_1K_AmbientOcclusion.png'),
            normalMap: normalMap,
            roughnessMap: textureLoader.load('assets/textures/ground/Moss001_1K_Roughness.png'),
            displacementMap: textureLoader.load('assets/textures/ground/Moss001_1K_Displacement.png'),
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.receiveShadow = true;
        groundMesh.rotateX(-Math.PI / 2);
        this.scene.add(groundMesh);
        this.octree.fromGraphNode(groundMesh);
        return this;
    }

    withPorchLights() {
        const porchLightLeft = new PorchLight();
        porchLightLeft.rotateY(-Math.PI / 2);
        porchLightLeft.position.set(-4.4, 1.8, 0);
        this.scene.add(porchLightLeft);
        const porchLightRight = new PorchLight();
        porchLightRight.position.set(3.4, 1.8, 3.8);
        porchLightRight.rotateY(-Math.PI / 2);
        this.scene.add(porchLightRight);
        const porchLightFront = new PorchLight();
        porchLightFront.position.set(3.5, 1.8, 0.4);
        this.scene.add(porchLightFront);
        const porchLightBack = new PorchLight();
        porchLightBack.rotateY(Math.PI);
        porchLightBack.position.set(0.625, 1.8, -4.4);
        this.scene.add(porchLightBack);
        return this;
    }

    withPicketFence() {
        // (-10, 0, -10) -> (-10, 0, 10)
        for (let i = 0; i < 14; i++) {
            const picketFence = new PicketFence();
            picketFence.position.set(-10 + 1.5 * i, 0, -10);
            this.scene.add(picketFence);
        }
        // (-10, 0, -10) -> (-10, 0, 10)
        for (let i = 0; i < 14; i++) {
            const picketFence = new PicketFence();
            picketFence.rotateY(Math.PI / 2);
            picketFence.position.set(-10, 0, -10 + 1.5 * i);
            this.scene.add(picketFence);
        }
        // (-10, 0, 10) -> (10, 0, 10)
        for (let i = 0; i < 14; i++) {
            if (i === 7) {
                continue;
            }
            const picketFence = new PicketFence();
            picketFence.position.set(-10 + 1.5 * i, 0, 10);
            this.scene.add(picketFence);
        }
        // (10, 0, -10) -> (10, 0, 10)
        for (let i = 0; i < 14; i++) {
            const picketFence = new PicketFence();
            picketFence.rotateY(Math.PI / 2);
            picketFence.position.set(10, 0, -10 + 1.5 * i);
            this.scene.add(picketFence);
        }
        return this;
    }

    withTrees() {
        const treePositions = [
            [15, 0, -15],
            [18, 0, -1],
            [14.5, 0, 1],
            [8, 0, 13.5],
            [-5, 0, 15],
            [-13, 0, 15],
            [-14, 0, -1],
            [-13.5, 0, -13],
            [-10, 0, -17],
            [8, 0, -14]
        ];
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('assets/objects/pine_tree/scene.gltf', (gltf) => {
            gltf.scene.scale.set(0.04, 0.04, 0.04);
            gltf.scene.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = child.receiveShadow = true;
                }
            });
            const trees = new THREE.Group();
            for (let i = 0; i < 10; i++) {
                const tree = gltf.scene.clone();
                tree.position.set(
                    treePositions[i][0],
                    treePositions[i][1],
                    treePositions[i][2]
                );
                trees.add(tree);
            }
            this.scene.add(trees);
            this.octree.fromGraphNode(trees);
        });
        return this;
    }

    withHouse() {
        this.house = new HouseBuilder(this.scene, this.octree).build();
        return this;
    }

    withSceneLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffe0, 0.25);
        this.scene.add(ambientLight);
        const hemisphereLight = new THREE.HemisphereLight(0xc1445, 0x01322, 1);
        this.scene.add(hemisphereLight);
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        // directionalLight.lookAt(scene.position);
        // scene.add(directionalLight);
        return this;
    }

    withBackground() {
        // Background - Night Sky
        const backgroundLoader = new THREE.CubeTextureLoader();
        this.scene.background = backgroundLoader.load([
            'assets/textures/background/pos-x.png',
            'assets/textures/background/neg-x.png',
            'assets/textures/background/pos-y.png',
            'assets/textures/background/neg-y.png',
            'assets/textures/background/pos-z.png',
            'assets/textures/background/neg-z.png'
        ]);
    }

    build() {
        this.withGround()
            .withPicketFence()
            .withPorchLights()
            .withTrees()
            .withHouse()
            .withSceneLights()
            .withBackground();
        if (!this.house) {
            throw new Error('House not initialized');
        }
        return new World(this.house, this.scene, this.octree);
    }
}