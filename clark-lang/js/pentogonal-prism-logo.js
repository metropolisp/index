(function () {
  console.log('external pentogonal-prism-logo.js loaded');
  // Create a wireframe pentagonal prism (edges only) and mount it inside any
  // element with class `prism-root`.
  function createPrism(container) {
    if (!window.THREE || !container) return;
    if (container.__prismInit) return; // idempotent

    const scene = new THREE.Scene();

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;
    const baseCameraZ = camera.position.z;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // transparent background
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height, false);
    renderer.domElement.style.display = "block";

    container.appendChild(renderer.domElement);

    // --- Base geometry (pentagonal prism) ---
    const geometry = new THREE.CylinderGeometry(1.2, 1.2, 1.4, 5);
    geometry.rotateX(Math.PI / 2);
    geometry.rotateZ(Math.PI / 5);
    // compute bounding sphere once so we can size the camera to avoid clipping
    geometry.computeBoundingSphere();

    // Extract ONLY outer edges
    const edges = new THREE.EdgesGeometry(geometry);

    // Ghostly white line material (edges)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45
    });

    // Faint translucent mesh to preserve silhouette when edges overlap
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const outline = new THREE.LineSegments(edges, lineMaterial);
    const prismMesh = new THREE.Mesh(geometry, fillMaterial);

    // apply a small fixed tilt so the prism never becomes perfectly edge-on
    const TILT = 0.14; // radians (~8°)
    outline.rotation.x = TILT;
    prismMesh.rotation.x = TILT;

    scene.add(prismMesh);
    scene.add(outline);

    // Adjust camera so a scaled object will not be clipped by the frustum.
    function fitCameraToScale(scale) {
      // bounding radius from geometry (fallback if not available)
      const baseRadius = (geometry.boundingSphere && geometry.boundingSphere.radius) ? geometry.boundingSphere.radius : 1.4;
      const radius = baseRadius * scale;

      const vHalfFov = (camera.fov * Math.PI / 180) * 0.5;
      const hHalfFov = Math.atan(Math.tan(vHalfFov) * camera.aspect);

      // distance required so the sphere's angular radius fits within each half-FOV
      const requiredV = radius / Math.sin(vHalfFov);
      const requiredH = radius / Math.sin(hHalfFov);
      const required = Math.max(requiredV, requiredH);

      // never move closer than the design camera; add a small safety margin
      camera.position.z = Math.max(baseCameraZ, required * 1.02);
      camera.updateProjectionMatrix();
    }

    // Scale the prism relative to the *container height* so the object
    // fills larger hero containers but stays bounded (prevents overflow).
    function updateScale() {
      // if user forced a scale externally, honor it
      if (container.__prismForcedScale) {
        const s = container.__prismForcedScale;
        prismMesh.scale.set(s, s, s);
        outline.scale.set(s, s, s);
        try { fitCameraToScale(s); } catch (e) {}
        return;
      }
      const r = container.getBoundingClientRect();
      const h = Math.max(1, Math.floor(r.height));
      // baseline: 250px container height → scale 1. Limit growth for large
      // hero containers so the mesh doesn't overflow the viewport.
      const scale = Math.max(1, Math.min(1.6, h / 250));
      prismMesh.scale.set(scale, scale, scale);
      outline.scale.set(scale, scale, scale);
      // ensure camera is positioned to fully contain the scaled object
      try { fitCameraToScale(scale); } catch (e) { /* ignore */ }
    }

    // Resize handler
    function onResize() {
      const r = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // update object scale to match new container size
      try { updateScale(); } catch (e) { /* ignore */ }
    }

    // Animation parameters exposed on the container so external controls can modify
    container.__prismSpeed = 0.0075; // units per frame
    container.__prismPaused = false;

    // API methods for external control
    container.__prismSetSpeed = function (s) {
      // Always force positive speed for rightward (clockwise) rotation
      container.__prismSpeed = Math.abs(s);
    };
    container.__prismSetAngle = function (a) {
      outline.rotation.y = a;
      prismMesh.rotation.y = a;
      container.__prismCurrentAngle = a;
    };
    container.__prismPause = function () { container.__prismPaused = true; };
    container.__prismResume = function () { container.__prismPaused = false; };
    // allow external override of scale
    container.__prismSetScale = function (s) {
      if (typeof s !== 'number' || isNaN(s) || s <= 0) return;
      prismMesh.scale.set(s, s, s);
      outline.scale.set(s, s, s);
      try { fitCameraToScale(s); } catch (e) { /* ignore */ }
      container.__prismForcedScale = s;
    };
    container.__prismResetScale = function() { container.__prismForcedScale = null; updateScale(); };
    // and change background
    // store original bg color so we can restore it
    let originalBg = null;
    container.__prismSetBg = function (col) {
      const bgElem = container.parentNode && container.parentNode.querySelector('.background');
      if (!bgElem) return;
      // always ensure it sits behind everything
      bgElem.style.zIndex = '-1001';
      if (originalBg === null) {
        originalBg = window.getComputedStyle(bgElem).backgroundColor;
      }
      console.log('setBg called with', col);
      if (!col) {
        // remove inline style to let stylesheet prevail (should restore original purple)
        bgElem.style.backgroundColor = '';
        bgElem.style.background = '';
        if (container.parentNode) container.parentNode.style.backgroundColor = '';
        document.body.style.backgroundColor = '';
      } else {
        // force the precise color everywhere
        bgElem.style.setProperty('background-color', col, 'important');
        bgElem.style.setProperty('background', col, 'important');
        if (container.parentNode) container.parentNode.style.setProperty('background-color', col, 'important');
        document.body.style.setProperty('background-color', col, 'important');
      }
    };

    let rafId;
    function animate() {
      if (!container.__prismPaused) {
        // rotate both mesh and outline in sync (skip rotation for navbar)
        outline.rotation.y += container.__prismSpeed;
        prismMesh.rotation.y += container.__prismSpeed;
        container.__prismCurrentAngle = outline.rotation.y;
      }
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener("resize", onResize);
    onResize();
    animate();

    // mark initialized and expose a simple dispose
    container.__prismInit = true;
    container.__prismDispose = function () {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      // remove and dispose scene objects
      try {
        scene.remove(outline);
        if (outline.geometry) outline.geometry.dispose();
        if (outline.material) outline.material.dispose();
        scene.remove(prismMesh);
        if (prismMesh.geometry) prismMesh.geometry.dispose();
        if (prismMesh.material) prismMesh.material.dispose();
      } catch (e) {
        /* ignore cleanup errors */
      }
      renderer.dispose();
      container.__prismInit = false;
    };
  }

  function initAll() {
    const roots = document.querySelectorAll('.prism-root');
    for (const r of roots) {
      if (r.__prismInit) continue;

      // If the element is not yet laid out (very small), wait for it to acquire size
      const rect = r.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) {
        if (window.ResizeObserver) {
          const ro = new ResizeObserver((entries, observer) => {
            const cr = r.getBoundingClientRect();
            if (cr.width >= 8 && cr.height >= 8) {
              observer.disconnect();
              createPrism(r);
            }
          });
          ro.observe(r);
          continue;
        } else {
          // fallback retry
          setTimeout(() => { if (!r.__prismInit) createPrism(r); }, 250);
          continue;
        }
      }

      createPrism(r);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // ensure any missed elements are attempted again after full load
  window.addEventListener('load', initAll);
  // final safety retry
  setTimeout(initAll, 500);
})();
