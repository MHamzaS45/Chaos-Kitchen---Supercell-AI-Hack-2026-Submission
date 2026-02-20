// Player controller and interaction system
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { CONFIG } from './config.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    
    // Player representation
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 5);
    this.scene.add(this.mesh);
    
    // Animation state
    this.animationState = 'idle'; // idle, walking, grabbing
    this.animationTime = 0;
    this.playerModel = null;
    this.isGrabbing = false;
    this.grabAnimationTime = 0;
    
    // Load the model
    this.loadPlayerModel();
    
    // Movement
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 5;
    
    // Input state
    this.keys = {};
    this.setupInput();
    
    // Held item
    this.heldIngredient = null;
    this.heldIngredientMesh = null;
  }

  async loadPlayerModel() {
    const loader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();
    
    try {
      // Load the texture
      const texture = await textureLoader.loadAsync('https://rosebud.ai/assets/texture_diffuse_00.png?mYW3');
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Load the OBJ model
      const obj = await loader.loadAsync('https://rosebud.ai/assets/base.obj?tg8r');
      
      // Apply texture to all meshes
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Scale and position the model
      obj.scale.set(0.8, 0.8, 0.8);
      obj.position.set(0, 0, 0);
      obj.rotation.y = Math.PI; // Face forward
      
      this.playerModel = obj;
      this.mesh.add(obj);
    } catch (error) {
      console.error('Failed to load player model:', error);
      // Fallback to simple geometry
      this.createFallbackMesh();
    }
  }

  createFallbackMesh() {
    // Simple fallback if model fails to load
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4ecdc4,
      roughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    this.mesh.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffe4c4,
      roughness: 0.6
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    this.mesh.add(head);
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update(deltaTime) {
    // Movement
    const moveVector = new THREE.Vector3();
    
    if (this.keys['w'] || this.keys['arrowup']) moveVector.z -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveVector.z += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveVector.x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveVector.x += 1;
    
    const isMoving = moveVector.length() > 0;
    
    if (isMoving) {
      moveVector.normalize();
      this.velocity.copy(moveVector).multiplyScalar(this.moveSpeed * deltaTime);
      this.mesh.position.add(this.velocity);
      
      // Keep player in bounds
      this.mesh.position.x = Math.max(-8, Math.min(8, this.mesh.position.x));
      this.mesh.position.z = Math.max(-3, Math.min(8, this.mesh.position.z));
      
      // Update animation state
      if (!this.isGrabbing) {
        this.animationState = 'walking';
      }
    } else {
      if (!this.isGrabbing) {
        this.animationState = 'idle';
      }
    }
    
    // Update animations
    this.updateAnimation(deltaTime);
    
    // Update held ingredient position
    if (this.heldIngredientMesh) {
      this.heldIngredientMesh.position.copy(this.mesh.position);
      this.heldIngredientMesh.position.y = 2.5;
      this.heldIngredientMesh.position.x += 0.5;
    }
  }

  updateAnimation(deltaTime) {
    if (!this.playerModel) return;
    
    this.animationTime += deltaTime;
    
    // Handle grab animation
    if (this.isGrabbing) {
      this.grabAnimationTime += deltaTime;
      if (this.grabAnimationTime >= 0.3) {
        this.isGrabbing = false;
        this.grabAnimationTime = 0;
        this.animationState = 'idle';
      }
    }
    
    switch (this.animationState) {
      case 'idle':
        this.animateIdle();
        break;
      case 'walking':
        this.animateWalking();
        break;
      case 'grabbing':
        this.animateGrabbing();
        break;
    }
  }

  animateIdle() {
    if (!this.playerModel) return;
    
    // Gentle breathing motion
    const breathe = Math.sin(this.animationTime * 2) * 0.02;
    this.playerModel.scale.set(0.8, 0.8 + breathe, 0.8);
  }

  animateWalking() {
    if (!this.playerModel) return;
    
    // Bob up and down
    const bob = Math.sin(this.animationTime * 8) * 0.08;
    this.playerModel.position.y = bob;
    
    // Slight rotation side to side
    const sway = Math.sin(this.animationTime * 8) * 0.1;
    this.playerModel.rotation.z = sway;
  }

  animateGrabbing() {
    if (!this.playerModel) return;
    
    // Quick lean forward and back
    const progress = this.grabAnimationTime / 0.3;
    const lean = Math.sin(progress * Math.PI) * 0.3;
    this.playerModel.rotation.x = lean;
    
    // Slight scale pulse
    const pulse = 1 + Math.sin(progress * Math.PI) * 0.1;
    this.playerModel.scale.set(0.8 * pulse, 0.8, 0.8 * pulse);
  }

  playGrabAnimation() {
    this.animationState = 'grabbing';
    this.isGrabbing = true;
    this.grabAnimationTime = 0;
  }

  getPosition() {
    return this.mesh.position.clone();
  }

  pickupIngredient(ingredientId, ingredientMesh, state = 'raw') {
    if (this.heldIngredient) return false;
    
    this.heldIngredient = {
      ingredientId,
      state
    };
    this.heldIngredientMesh = ingredientMesh;
    
    // Play grab animation
    this.playGrabAnimation();
    
    return true;
  }

  dropIngredient() {
    const held = this.heldIngredient;
    this.heldIngredient = null;
    this.heldIngredientMesh = null;
    return held;
  }

  getHeldIngredient() {
    return this.heldIngredient;
  }

  hasIngredient() {
    return this.heldIngredient !== null;
  }

  // Process held ingredient
  processHeldIngredient(newState) {
    if (this.heldIngredient) {
      this.heldIngredient.state = newState;
      
      // Visual feedback - change color slightly
      if (this.heldIngredientMesh) {
        const ingredient = CONFIG.INGREDIENTS[this.heldIngredient.ingredientId];
        const baseColor = new THREE.Color(ingredient.color);
        
        if (newState === 'chopped') {
          baseColor.multiplyScalar(0.8); // Darker
        } else if (newState === 'cooked') {
          baseColor.lerp(new THREE.Color(0x8b4513), 0.3); // Brown tint
        }
        
        // Update all meshes in the group
        this.heldIngredientMesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.copy(baseColor);
          }
        });
      }
    }
  }
}
