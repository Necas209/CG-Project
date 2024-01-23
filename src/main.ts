import {WorldBuilder} from "./js/world";

const world = new WorldBuilder().build();
world.init();
world.render();