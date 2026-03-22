import * as THREE from 'three';

// Factory that creates Three.js geometry groups for each tile type.
// Each tile fits in a 2x2x2 bounding box (actually 2.01 to prevent seam cracks).
export class TileGeometry {
  private static readonly S = 2.01; // slightly oversized to prevent hairline cracks
  private static readonly H = TileGeometry.S / 2; // half size

  // Create a BoxGeometry with specified faces removed (for hollow window modules)
  // BoxGeometry face order: px(0), nx(1), py(2), ny(3), pz(4), nz(5) — 6 indices each
  private static createOpenBoxGeo(openFaces: {px?: boolean, nx?: boolean, pz?: boolean, nz?: boolean}): THREE.BufferGeometry {
    const geo = new THREE.BoxGeometry(this.S, this.S, this.S);
    const index = geo.index!;
    const newIndices: number[] = [];
    const keep = [!openFaces.px, !openFaces.nx, true, true, !openFaces.pz, !openFaces.nz];
    for (let f = 0; f < 6; f++) {
      if (keep[f]) {
        for (let i = 0; i < 6; i++) newIndices.push(index.array[f * 6 + i]);
      }
    }
    geo.setIndex(newIndices);
    geo.clearGroups();
    return geo;
  }

  // Fill in concrete around a window opening on a removed face (flush planes)
  private static addWindowWall(
    group: THREE.Group,
    dirX: number, dirZ: number,
    winW: number, winH: number,
    winCY: number
  ): void {
    const halfW = winW / 2;
    const halfH = winH / 2;
    const bot = winCY - halfH;
    const top = winCY + halfH;

    const panels: THREE.Mesh[] = [];

    if (dirX !== 0) {
      const fx = dirX * this.H;
      const rotY = dirX > 0 ? Math.PI / 2 : -Math.PI / 2;
      // Top strip
      const tH = this.H - top;
      if (tH > 0.01) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(this.S, tH));
        m.position.set(fx, top + tH / 2, 0);
        m.rotation.y = rotY;
        panels.push(m);
      }
      // Bottom strip
      const bH = bot + this.H;
      if (bH > 0.01) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(this.S, bH));
        m.position.set(fx, -this.H + bH / 2, 0);
        m.rotation.y = rotY;
        panels.push(m);
      }
      // Left strip
      const sW = this.H - halfW;
      if (sW > 0.01) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(sW, winH));
        m.position.set(fx, winCY, -(halfW + sW / 2));
        m.rotation.y = rotY;
        panels.push(m);
      }
      // Right strip
      if (sW > 0.01) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(sW, winH));
        m.position.set(fx, winCY, halfW + sW / 2);
        m.rotation.y = rotY;
        panels.push(m);
      }
    } else {
      const fz = dirZ * this.H;
      const rotY = dirZ > 0 ? 0 : Math.PI;
      const tH = this.H - top;
      if (tH > 0.01) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(this.S, tH));
        m.position.set(0, top + tH / 2, fz);
        m.rotation.y = rotY;
        panels.push(m);
      }
      const bH = bot + this.H;
      if (bH > 0.01) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(this.S, bH));
        m.position.set(0, -this.H + bH / 2, fz);
        m.rotation.y = rotY;
        panels.push(m);
      }
      const sW = this.H - halfW;
      if (sW > 0.01) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(sW, winH));
        m.position.set(-(halfW + sW / 2), winCY, fz);
        m.rotation.y = rotY;
        panels.push(m);
      }
      if (sW > 0.01) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(sW, winH));
        m.position.set(halfW + sW / 2, winCY, fz);
        m.rotation.y = rotY;
        panels.push(m);
      }
    }

    for (const p of panels) {
      p.userData.materialType = 'concreteDouble';
      group.add(p);
    }
  }

  static createTile(tileId: string): THREE.Group {
    const group = new THREE.Group();

    switch (tileId) {
      // Ground supports
      case 'PILOTI_CENTRAL':
        TileGeometry.buildPilotiCentral(group);
        break;
      case 'PILOTI_ESQUINA_PX_PZ':
        TileGeometry.buildPilotiCorner(group, 1, 1);
        break;
      case 'PILOTI_ESQUINA_NX_PZ':
        TileGeometry.buildPilotiCorner(group, -1, 1);
        break;
      case 'PILOTI_ESQUINA_NX_NZ':
        TileGeometry.buildPilotiCorner(group, -1, -1);
        break;
      case 'PILOTI_ESQUINA_PX_NZ':
        TileGeometry.buildPilotiCorner(group, 1, -1);
        break;
      case 'EMPTY_GROUND':
        // Intentionally empty — void at ground level
        break;

      // Transition layer
      case 'VIGA_CARGA_X':
        TileGeometry.buildVigaCargaX(group);
        break;
      case 'VIGA_CARGA_Z':
        TileGeometry.buildVigaCargaZ(group);
        break;

      // Habitation modules
      case 'MODULO_BALCON_PX':
        TileGeometry.buildModuloBalcon(group, 1, 0);
        break;
      case 'MODULO_BALCON_NX':
        TileGeometry.buildModuloBalcon(group, -1, 0);
        break;
      case 'MODULO_BALCON_PZ':
        TileGeometry.buildModuloBalcon(group, 0, 1);
        break;
      case 'MODULO_BALCON_NZ':
        TileGeometry.buildModuloBalcon(group, 0, -1);
        break;
      case 'MODULO_ACRISTADO_PX_PZ':
        TileGeometry.buildModuloAcristado(group, 1, 1);
        break;
      case 'MODULO_ACRISTADO_NX_PZ':
        TileGeometry.buildModuloAcristado(group, -1, 1);
        break;
      case 'MODULO_ACRISTADO_NX_NZ':
        TileGeometry.buildModuloAcristado(group, -1, -1);
        break;
      case 'MODULO_ACRISTADO_PX_NZ':
        TileGeometry.buildModuloAcristado(group, 1, -1);
        break;
      case 'TORRE_ESCALERA':
        TileGeometry.buildTorreEscalera(group);
        break;
      case 'CODO_ESCALERA':
        TileGeometry.buildCodoEscalera(group);
        break;

      // Connections
      case 'PASILLO_VOLADIZO_X':
        TileGeometry.buildPasilloVoladizoX(group);
        break;
      case 'PASILLO_VOLADIZO_Z':
        TileGeometry.buildPasilloVoladizoZ(group);
        break;

      // Void
      case 'VOID':
        // Intentionally empty — air gap within building mass
        break;

      // Column cap
      case 'LOSA_REMATE':
        TileGeometry.buildLosaRemate(group);
        break;

      // Roof / Coronamiento
      case 'TERRAZA_PRETIL':
        TileGeometry.buildTerrazaPretil(group);
        break;
      case 'CORONAMIENTO':
        TileGeometry.buildCoronamiento(group);
        break;
      case 'EMPTY_ROOF':
        // Intentionally empty — void at roof level
        break;
    }

    // Enable shadows on all meshes (glass should not cast opaque shadows)
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = child.userData.materialType !== 'glass';
        child.receiveShadow = true;
      }
    });

    return group;
  }

  // ==========================================
  // GROUND-LEVEL TILES
  // ==========================================

  // Piloti Central: Single large central cylindrical pillar + slab
  private static buildPilotiCentral(group: THREE.Group): void {
    const pillarRadius = 0.25;
    const pillarHeight = 1.8;
    const slabThickness = 0.15;

    const pillarGeo = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight, 12);
    const pillar = new THREE.Mesh(pillarGeo);
    pillar.position.y = pillarHeight / 2 - this.H + slabThickness / 2;
    group.add(pillar);

    const slabGeo = new THREE.BoxGeometry(this.S, slabThickness, this.S);
    const slab = new THREE.Mesh(slabGeo);
    slab.position.y = this.H - slabThickness / 2;
    group.add(slab);
  }

  // Piloti Esquina: Corner L-shape stilt
  private static buildPilotiCorner(group: THREE.Group, signX: number, signZ: number): void {
    const pillarWidth = 0.4;
    const pillarHeight = 1.8;
    const slabThickness = 0.2;

    const geo1 = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarWidth * 2);
    const part1 = new THREE.Mesh(geo1);
    part1.position.set(
      signX * (this.H - pillarWidth / 2),
      pillarHeight / 2 - this.H + slabThickness / 2,
      signZ * (this.H - pillarWidth)
    );
    group.add(part1);

    const geo2 = new THREE.BoxGeometry(pillarWidth * 2, pillarHeight, pillarWidth);
    const part2 = new THREE.Mesh(geo2);
    part2.position.set(
      signX * (this.H - pillarWidth),
      pillarHeight / 2 - this.H + slabThickness / 2,
      signZ * (this.H - pillarWidth / 2)
    );
    group.add(part2);

    // Top slab
    const slabGeo = new THREE.BoxGeometry(this.S, slabThickness, this.S);
    const slab = new THREE.Mesh(slabGeo);
    slab.position.y = this.H - slabThickness / 2;
    group.add(slab);
  }

  // ==========================================
  // TRANSITION LAYER TILES
  // ==========================================

  // Viga de Carga X: Heavy loading beam along X axis
  private static buildVigaCargaX(group: THREE.Group): void {
    const beamWidth = this.S;
    const beamHeight = 0.8;
    const beamDepth = 0.8;

    const geo = new THREE.BoxGeometry(beamWidth, beamHeight, beamDepth);
    const mesh = new THREE.Mesh(geo);
    mesh.position.y = -this.H + beamHeight / 2;
    group.add(mesh);

    const detailGeo = new THREE.BoxGeometry(beamWidth, 0.1, beamDepth + 0.1);
    const detail = new THREE.Mesh(detailGeo);
    detail.position.y = -this.H + beamHeight - 0.1;
    detail.userData.materialType = 'darkConcrete';
    group.add(detail);
  }

  // Viga de Carga Z: Heavy loading beam along Z axis
  private static buildVigaCargaZ(group: THREE.Group): void {
    const beamWidth = 0.8;
    const beamHeight = 0.8;
    const beamDepth = this.S;

    const geo = new THREE.BoxGeometry(beamWidth, beamHeight, beamDepth);
    const mesh = new THREE.Mesh(geo);
    mesh.position.y = -this.H + beamHeight / 2;
    group.add(mesh);

    const detailGeo = new THREE.BoxGeometry(beamWidth + 0.1, 0.1, beamDepth);
    const detail = new THREE.Mesh(detailGeo);
    detail.position.y = -this.H + beamHeight - 0.1;
    detail.userData.materialType = 'darkConcrete';
    group.add(detail);
  }

  // ==========================================
  // HABITATION MODULES
  // ==========================================

  // Modulo Balcon: Solid concrete cube with a smaller box protruding from one face
  // dirX/dirZ: which direction the balcony protrudes (e.g. 1,0 = +X)
  private static buildModuloBalcon(group: THREE.Group, dirX: number, dirZ: number): void {
    // Hollow concrete body — window face removed so interior is visible through glass
    const openFaces = { px: dirX === 1, nx: dirX === -1, pz: dirZ === 1, nz: dirZ === -1 };
    const bodyGeo = this.createOpenBoxGeo(openFaces);
    const body = new THREE.Mesh(bodyGeo);
    body.userData.materialType = 'concreteDouble';
    group.add(body);

    // Balcony door — tall glass panel nearly full height
    const doorWidth = 0.9;
    const doorHeight = this.S - 0.3; // nearly full tile height
    const doorCY = 0;                // centered vertically
    const winOffset = this.H + 0.02;

    // Concrete infill around the door opening
    this.addWindowWall(group, dirX, dirZ, doorWidth, doorHeight, doorCY);

    // Random warm interior light (simulates inhabited rooms)
    if (Math.random() < 0.4) {
      const light = new THREE.PointLight(0xffe0b0, 0.8, 4);
      light.position.set(0, 0, 0);
      light.castShadow = false;
      group.add(light);
    }

    // Glass pane
    const winGeo = new THREE.PlaneGeometry(doorWidth, doorHeight);
    const win = new THREE.Mesh(winGeo);
    if (dirX !== 0) {
      win.position.set(dirX * winOffset, doorCY, 0);
      win.rotation.y = dirX > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      win.position.set(0, doorCY, dirZ * winOffset);
      win.rotation.y = dirZ > 0 ? 0 : Math.PI;
    }
    win.userData.materialType = 'glass';
    group.add(win);

    // Mullions — flat accent strips flush with the wall face
    const mullW = 0.03;
    const wallPos = this.H + 0.001;
    const rotY = dirX !== 0
      ? (dirX > 0 ? Math.PI / 2 : -Math.PI / 2)
      : (dirZ > 0 ? 0 : Math.PI);

    // Vertical mullions (3 dividers)
    const vPositions = [-doorWidth / 3, 0, doorWidth / 3];
    for (const pos of vPositions) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(mullW, doorHeight));
      if (dirX !== 0) {
        m.position.set(dirX * wallPos, doorCY, pos);
      } else {
        m.position.set(pos, doorCY, dirZ * wallPos);
      }
      m.rotation.y = rotY;
      m.userData.materialType = 'accent';
      group.add(m);
    }
    // Horizontal mullion — door/transom divider at ~2/3 height
    const transom = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth, mullW));
    const transomY = doorCY + doorHeight * 0.2;
    if (dirX !== 0) {
      transom.position.set(dirX * wallPos, transomY, 0);
    } else {
      transom.position.set(0, transomY, dirZ * wallPos);
    }
    transom.rotation.y = rotY;
    transom.userData.materialType = 'accent';
    group.add(transom);

    // Balcony — floor slab + side walls + front wall, open top
    const balcDepth = 0.6;   // how far it protrudes
    const balcWidth = this.S - 0.1;   // almost full tile width
    const slabT = 0.1;       // floor slab thickness
    const wallT = 0.06;      // side/front wall thickness
    const wallH = 0.45;      // parapet wall height
    const floorY = -this.H;  // bottom of tile

    if (dirX !== 0) {
      // Floor slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(balcDepth, slabT, balcWidth));
      slab.position.set(dirX * (this.H + balcDepth / 2), floorY + slabT / 2, 0);
      group.add(slab);
      // Left side wall
      const lw = new THREE.Mesh(new THREE.BoxGeometry(balcDepth, wallH, wallT));
      lw.position.set(dirX * (this.H + balcDepth / 2), floorY + slabT + wallH / 2, -balcWidth / 2 + wallT / 2);
      group.add(lw);
      // Right side wall
      const rw = new THREE.Mesh(new THREE.BoxGeometry(balcDepth, wallH, wallT));
      rw.position.set(dirX * (this.H + balcDepth / 2), floorY + slabT + wallH / 2, balcWidth / 2 - wallT / 2);
      group.add(rw);
      // Front wall
      const fw = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, balcWidth));
      fw.position.set(dirX * (this.H + balcDepth - wallT / 2), floorY + slabT + wallH / 2, 0);
      group.add(fw);
    } else {
      // Floor slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(balcWidth, slabT, balcDepth));
      slab.position.set(0, floorY + slabT / 2, dirZ * (this.H + balcDepth / 2));
      group.add(slab);
      // Left side wall
      const lw = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, balcDepth));
      lw.position.set(-balcWidth / 2 + wallT / 2, floorY + slabT + wallH / 2, dirZ * (this.H + balcDepth / 2));
      group.add(lw);
      // Right side wall
      const rw = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, balcDepth));
      rw.position.set(balcWidth / 2 - wallT / 2, floorY + slabT + wallH / 2, dirZ * (this.H + balcDepth / 2));
      group.add(rw);
      // Front wall
      const fw = new THREE.Mesh(new THREE.BoxGeometry(balcWidth, wallH, wallT));
      fw.position.set(0, floorY + slabT + wallH / 2, dirZ * (this.H + balcDepth - wallT / 2));
      group.add(fw);
    }
  }

  // Modulo Acristado: Glazed module with glass corners and perforated brise-soleil facade
  // glassXSign/glassZSign: which corner has glass (e.g. 1,1 = +X/+Z corner)
  private static buildModuloAcristado(group: THREE.Group, glassXSign: number, glassZSign: number): void {
    // Hollow concrete body — glass corner faces removed so interior is visible
    const openFaces = { px: glassXSign === 1, nx: glassXSign === -1, pz: glassZSign === 1, nz: glassZSign === -1 };
    const bodyGeo = this.createOpenBoxGeo(openFaces);
    const body = new THREE.Mesh(bodyGeo);
    body.userData.materialType = 'concreteDouble';
    group.add(body);

    const glassInset = 0.02;
    const glassHeight = this.S * 0.75;
    const glassWidth = this.S * 0.9;

    // Concrete infill around both glass openings
    this.addWindowWall(group, glassXSign, 0, glassWidth, glassHeight, 0);
    this.addWindowWall(group, 0, glassZSign, glassWidth, glassHeight, 0);

    // Random warm interior light (simulates inhabited rooms)
    if (Math.random() < 0.4) {
      const light = new THREE.PointLight(0xffe0b0, 0.8, 4);
      light.position.set(0, 0, 0);
      light.castShadow = false;
      group.add(light);
    }

    // Glass panel on the X face
    const glassGeoX = new THREE.PlaneGeometry(glassWidth, glassHeight);
    const glassX = new THREE.Mesh(glassGeoX);
    glassX.position.set(glassXSign * (this.H + glassInset), 0, 0);
    glassX.rotation.y = glassXSign > 0 ? Math.PI / 2 : -Math.PI / 2;
    glassX.userData.materialType = 'glass';
    group.add(glassX);

    // Glass panel on the Z face
    const glassGeoZ = new THREE.PlaneGeometry(glassWidth, glassHeight);
    const glassZ = new THREE.Mesh(glassGeoZ);
    glassZ.position.set(0, 0, glassZSign * (this.H + glassInset));
    glassZ.rotation.y = glassZSign > 0 ? 0 : Math.PI;
    glassZ.userData.materialType = 'glass';
    group.add(glassZ);

    // Mullions — flat accent strips flush with the wall face
    const mullW = 0.03;
    const wallPos = this.H + 0.001;
    const numV = 4;
    const numH = 3;

    // X face mullions
    const rotYX = glassXSign > 0 ? Math.PI / 2 : -Math.PI / 2;
    for (let i = 0; i < numV; i++) {
      const mz = -glassWidth / 2 + (i + 0.5) * (glassWidth / numV);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(mullW, glassHeight));
      m.position.set(glassXSign * wallPos, 0, mz);
      m.rotation.y = rotYX;
      m.userData.materialType = 'accent';
      group.add(m);
    }
    for (let i = 0; i < numH; i++) {
      const my = -glassHeight / 2 + (i + 0.5) * (glassHeight / numH);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(glassWidth, mullW));
      m.position.set(glassXSign * wallPos, my, 0);
      m.rotation.y = rotYX;
      m.userData.materialType = 'accent';
      group.add(m);
    }

    // Z face mullions
    const rotYZ = glassZSign > 0 ? 0 : Math.PI;
    for (let i = 0; i < numV; i++) {
      const mx = -glassWidth / 2 + (i + 0.5) * (glassWidth / numV);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(mullW, glassHeight));
      m.position.set(mx, 0, glassZSign * wallPos);
      m.rotation.y = rotYZ;
      m.userData.materialType = 'accent';
      group.add(m);
    }
    for (let i = 0; i < numH; i++) {
      const my = -glassHeight / 2 + (i + 0.5) * (glassHeight / numH);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(glassWidth, mullW));
      m.position.set(0, my, glassZSign * wallPos);
      m.rotation.y = rotYZ;
      m.userData.materialType = 'accent';
      group.add(m);
    }
  }

  // Torre Escalera: Solid box with horizontal groove lines (stairwell core)
  private static buildTorreEscalera(group: THREE.Group): void {
    const bodyGeo = new THREE.BoxGeometry(this.S, this.S, this.S);
    const body = new THREE.Mesh(bodyGeo);
    group.add(body);

    const grooveDepth = 0.03;
    const grooveHeight = 0.04;
    const numGrooves = 6;

    for (let i = 0; i < numGrooves; i++) {
      const yPos = -this.H + this.S * ((i + 1) / (numGrooves + 1));

      for (const xSign of [-1, 1]) {
        const grooveGeo = new THREE.BoxGeometry(grooveDepth, grooveHeight, this.S * 0.95);
        const groove = new THREE.Mesh(grooveGeo);
        groove.position.set(xSign * (this.H + 0.001), yPos, 0);
        groove.userData.materialType = 'darkConcrete';
        group.add(groove);
      }

      for (const zSign of [-1, 1]) {
        const grooveGeo = new THREE.BoxGeometry(this.S * 0.95, grooveHeight, grooveDepth);
        const groove = new THREE.Mesh(grooveGeo);
        groove.position.set(0, yPos, zSign * (this.H + 0.001));
        groove.userData.materialType = 'darkConcrete';
        group.add(groove);
      }
    }
  }

  // Codo Escalera: L-shaped stair landing/elbow piece
  private static buildCodoEscalera(group: THREE.Group): void {
    const legWidth = this.S * 0.55;

    // Leg 1: occupying -X half, full Z depth
    const leg1Geo = new THREE.BoxGeometry(legWidth, this.S, this.S);
    const leg1 = new THREE.Mesh(leg1Geo);
    leg1.position.x = -(this.S - legWidth) / 2;
    group.add(leg1);

    // Leg 2: occupying -Z half, full X depth
    const leg2Geo = new THREE.BoxGeometry(this.S, this.S, legWidth);
    const leg2 = new THREE.Mesh(leg2Geo);
    leg2.position.z = -(this.S - legWidth) / 2;
    group.add(leg2);

    // Landing slab detail at the L-junction (inner corner)
    const landingGeo = new THREE.BoxGeometry(0.3, 0.08, 0.3);
    const landing = new THREE.Mesh(landingGeo);
    landing.position.set(-0.2, 0, -0.2);
    landing.userData.materialType = 'darkConcrete';
    group.add(landing);

    // Horizontal groove lines on exposed faces
    const grooveDepth = 0.03;
    const grooveHeight = 0.04;
    const numGrooves = 4;

    for (let i = 0; i < numGrooves; i++) {
      const yPos = -this.H + this.S * ((i + 1) / (numGrooves + 1));

      // Groove on +X face of leg 2
      const gx = new THREE.BoxGeometry(grooveDepth, grooveHeight, legWidth * 0.9);
      const grooveX = new THREE.Mesh(gx);
      grooveX.position.set(this.H + 0.001, yPos, -(this.S - legWidth) / 2);
      grooveX.userData.materialType = 'darkConcrete';
      group.add(grooveX);

      // Groove on +Z face of leg 1
      const gz = new THREE.BoxGeometry(legWidth * 0.9, grooveHeight, grooveDepth);
      const grooveZ = new THREE.Mesh(gz);
      grooveZ.position.set(-(this.S - legWidth) / 2, yPos, this.H + 0.001);
      grooveZ.userData.materialType = 'darkConcrete';
      group.add(grooveZ);
    }
  }

  // ==========================================
  // CONNECTION TILES
  // ==========================================

  // Pasillo Voladizo X: Cantilevered corridor along X axis
  private static buildPasilloVoladizoX(group: THREE.Group): void {
    const corridorWidth = 1.0;
    const corridorHeight = 1.2;
    const corridorLength = this.S;
    const wallThickness = 0.08;

    const corridorGeo = new THREE.BoxGeometry(corridorLength, corridorHeight, corridorWidth);
    const corridor = new THREE.Mesh(corridorGeo);
    corridor.position.y = -0.2;
    group.add(corridor);

    for (const zSign of [-1, 1]) {
      const wallGeo = new THREE.BoxGeometry(corridorLength, corridorHeight + 0.3, wallThickness);
      const wall = new THREE.Mesh(wallGeo);
      wall.position.set(0, -0.05, zSign * (corridorWidth / 2 + wallThickness / 2));
      group.add(wall);
    }

    const floorGeo = new THREE.BoxGeometry(corridorLength, 0.1, corridorWidth + wallThickness * 2 + 0.2);
    const floor = new THREE.Mesh(floorGeo);
    floor.position.y = -0.2 - corridorHeight / 2 - 0.05;
    group.add(floor);
  }

  // Pasillo Voladizo Z: Cantilevered corridor along Z axis
  private static buildPasilloVoladizoZ(group: THREE.Group): void {
    const corridorWidth = 1.0;
    const corridorHeight = 1.2;
    const corridorDepth = this.S;
    const wallThickness = 0.08;

    const corridorGeo = new THREE.BoxGeometry(corridorWidth, corridorHeight, corridorDepth);
    const corridor = new THREE.Mesh(corridorGeo);
    corridor.position.y = -0.2;
    group.add(corridor);

    for (const xSign of [-1, 1]) {
      const wallGeo = new THREE.BoxGeometry(wallThickness, corridorHeight + 0.3, corridorDepth);
      const wall = new THREE.Mesh(wallGeo);
      wall.position.set(xSign * (corridorWidth / 2 + wallThickness / 2), -0.05, 0);
      group.add(wall);
    }

    const floorGeo = new THREE.BoxGeometry(corridorWidth + wallThickness * 2 + 0.2, 0.1, corridorDepth);
    const floor = new THREE.Mesh(floorGeo);
    floor.position.y = -0.2 - corridorHeight / 2 - 0.05;
    group.add(floor);
  }

  // ==========================================
  // COLUMN CAP TILE
  // ==========================================

  // Losa Remate: Flat concrete slab that caps a column at variable height
  private static buildLosaRemate(group: THREE.Group): void {
    const slabThickness = 0.15;
    const slabGeo = new THREE.BoxGeometry(this.S, slabThickness, this.S);
    const slab = new THREE.Mesh(slabGeo);
    slab.position.y = -this.H + slabThickness / 2;
    group.add(slab);
  }

  // ==========================================
  // ROOF / CORONAMIENTO TILES
  // ==========================================

  // Terraza Pretil: Flat slab with parapet walls around edges
  private static buildTerrazaPretil(group: THREE.Group): void {
    const slabThickness = 0.15;
    const parapetHeight = 0.5;
    const parapetThickness = 0.08;

    const slabGeo = new THREE.BoxGeometry(this.S, slabThickness, this.S);
    const slab = new THREE.Mesh(slabGeo);
    slab.position.y = -this.H + slabThickness / 2;
    group.add(slab);

    const parapetY = -this.H + slabThickness + parapetHeight / 2;

    for (const xSign of [-1, 1]) {
      const pGeo = new THREE.BoxGeometry(parapetThickness, parapetHeight, this.S);
      const p = new THREE.Mesh(pGeo);
      p.position.set(xSign * (this.H - parapetThickness / 2), parapetY, 0);
      group.add(p);
    }

    for (const zSign of [-1, 1]) {
      const pGeo = new THREE.BoxGeometry(this.S - parapetThickness * 2, parapetHeight, parapetThickness);
      const p = new THREE.Mesh(pGeo);
      p.position.set(0, parapetY, zSign * (this.H - parapetThickness / 2));
      group.add(p);
    }
  }

  // Coronamiento: Detailed observatory — layers: concrete base → windows → brown paneled disk
  private static buildCoronamiento(group: THREE.Group): void {
    const diskRadius = 3.5;
    const numSeg = 48;

    // Layer heights (bottom to top)
    const supportHeight = 0.8;   // Square concrete support block
    const concreteBaseH = 0.4;   // Circular concrete base ring
    const windowBandH = 0.9;     // Glass window band
    const brownWallH = 0.7;      // Brown paneled wall
    const roofThickness = 0.35;  // Brown top disk/ceiling

    let curY = -this.H;

    // === SQUARE CONCRETE SUPPORT BLOCK ===
    const supportGeo = new THREE.BoxGeometry(this.S, supportHeight, this.S);
    const support = new THREE.Mesh(supportGeo);
    support.position.y = curY + supportHeight / 2;
    support.userData.materialType = 'darkConcrete';
    group.add(support);
    curY += supportHeight;

    // === CIRCULAR CONCRETE BASE RING ===
    const baseGeo = new THREE.CylinderGeometry(diskRadius, diskRadius * 0.95, concreteBaseH, numSeg);
    const base = new THREE.Mesh(baseGeo);
    base.position.y = curY + concreteBaseH / 2;
    // Default material = concrete
    group.add(base);
    curY += concreteBaseH;

    // === GOLD/ORANGE ACCENT STRIPE between concrete base and windows ===
    const accentGeo = new THREE.TorusGeometry(diskRadius + 0.02, 0.04, 8, numSeg);
    const accent = new THREE.Mesh(accentGeo);
    accent.position.y = curY;
    accent.rotation.x = Math.PI / 2;
    accent.userData.materialType = 'accent';
    group.add(accent);

    // === WINDOW BAND (glass strip around circumference) ===
    const windowGeo = new THREE.CylinderGeometry(diskRadius, diskRadius, windowBandH, numSeg, 1, true);
    const windowBand = new THREE.Mesh(windowGeo);
    windowBand.position.y = curY + windowBandH / 2;
    windowBand.userData.materialType = 'glass';
    group.add(windowBand);

    // Window mullions — vertical dividers in the glass band
    const numMullions = 24;
    for (let i = 0; i < numMullions; i++) {
      const angle = (i / numMullions) * Math.PI * 2;
      const mullGeo = new THREE.BoxGeometry(0.03, windowBandH, 0.06);
      const mull = new THREE.Mesh(mullGeo);
      mull.position.set(
        Math.cos(angle) * (diskRadius + 0.03),
        curY + windowBandH / 2,
        Math.sin(angle) * (diskRadius + 0.03)
      );
      mull.rotation.y = -angle;
      mull.userData.materialType = 'darkConcrete';
      group.add(mull);
    }
    curY += windowBandH;

    // === BROWN PANELED WALL with vertical slats ===
    const wallGeo = new THREE.CylinderGeometry(diskRadius, diskRadius, brownWallH, numSeg);
    const wall = new THREE.Mesh(wallGeo);
    wall.position.y = curY + brownWallH / 2;
    wall.userData.materialType = 'observatory';
    group.add(wall);

    // Vertical panel slats on the brown wall
    const numSlats = 24;
    for (let i = 0; i < numSlats; i++) {
      const angle = (i / numSlats) * Math.PI * 2;
      const slatGeo = new THREE.BoxGeometry(0.04, brownWallH * 0.9, 0.1);
      const slat = new THREE.Mesh(slatGeo);
      slat.position.set(
        Math.cos(angle) * (diskRadius + 0.01),
        curY + brownWallH / 2,
        Math.sin(angle) * (diskRadius + 0.01)
      );
      slat.rotation.y = -angle;
      slat.userData.materialType = 'darkConcrete';
      group.add(slat);
    }
    curY += brownWallH;

    // === BROWN ROOF/CEILING — outer ring flat, inner circle raised for dome inclination ===
    const innerRaise = 0.35;
    // Outer ring (flat)
    const outerRingGeo = new THREE.RingGeometry(diskRadius * 0.35, diskRadius, numSeg);
    const outerRing = new THREE.Mesh(outerRingGeo);
    outerRing.position.y = curY + roofThickness;
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.userData.materialType = 'observatory';
    group.add(outerRing);

    // Outer wall thickness
    const roofWallGeo = new THREE.CylinderGeometry(diskRadius, diskRadius, roofThickness, numSeg, 1, true);
    const roofWall = new THREE.Mesh(roofWallGeo);
    roofWall.position.y = curY + roofThickness / 2;
    roofWall.userData.materialType = 'observatory';
    group.add(roofWall);

    // Raised inner circle (dome center)
    const innerDiskGeo = new THREE.CylinderGeometry(diskRadius * 0.35, diskRadius * 0.35, 0.08, numSeg);
    const innerDisk = new THREE.Mesh(innerDiskGeo);
    innerDisk.position.y = curY + roofThickness + innerRaise;
    innerDisk.userData.materialType = 'observatory';
    group.add(innerDisk);

    // Connecting cone slope between outer ring and raised inner
    const slopeGeo = new THREE.CylinderGeometry(diskRadius * 0.35, diskRadius * 0.9, innerRaise, numSeg, 1, true);
    const slope = new THREE.Mesh(slopeGeo);
    slope.position.y = curY + roofThickness + innerRaise / 2;
    slope.userData.materialType = 'observatory';
    group.add(slope);

    const roofTopY = curY + roofThickness;

    // Top rim
    const topRimGeo = new THREE.TorusGeometry(diskRadius - 0.02, 0.07, 8, numSeg);
    const topRim = new THREE.Mesh(topRimGeo);
    topRim.position.y = roofTopY;
    topRim.rotation.x = Math.PI / 2;
    topRim.userData.materialType = 'darkConcrete';
    group.add(topRim);

    // Bottom rim band (where wall meets concrete base)
    const rimBandGeo = new THREE.TorusGeometry(diskRadius, 0.1, 8, numSeg);
    const rimBand = new THREE.Mesh(rimBandGeo);
    rimBand.position.y = -this.H + supportHeight + concreteBaseH;
    rimBand.rotation.x = Math.PI / 2;
    rimBand.userData.materialType = 'darkConcrete';
    group.add(rimBand);

    // === RADIAL SPOKE LINES — straight from outer edge to inner circle ===
    const numSpokes = 16;
    const spokeOuterR = diskRadius * 0.92;
    const spokeInnerR = diskRadius * 0.36;
    const spokeOuterY = roofTopY + 0.03;
    const spokeInnerY = roofTopY + innerRaise + 0.03;

    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const ox = cosA * spokeOuterR, oz = sinA * spokeOuterR;
      const ix = cosA * spokeInnerR, iz = sinA * spokeInnerR;
      const dx = ix - ox, dy = spokeInnerY - spokeOuterY, dz = iz - oz;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Parent at outer point, lookAt inner point
      const pivot = new THREE.Group();
      pivot.position.set(ox, spokeOuterY, oz);
      pivot.lookAt(ix, spokeInnerY, iz);
      group.add(pivot);

      const spokeGeo = new THREE.BoxGeometry(0.04, 0.03, len);
      const spoke = new THREE.Mesh(spokeGeo);
      spoke.position.z = len / 2; // extend inward toward inner circle
      spoke.userData.materialType = 'darkConcrete';
      pivot.add(spoke);
    }

    // Inner concentric ring on raised dome
    const innerRingGeo = new THREE.TorusGeometry(diskRadius * 0.3, 0.06, 8, 32);
    const innerRing = new THREE.Mesh(innerRingGeo);
    innerRing.position.y = spokeInnerY + 0.04;
    innerRing.rotation.x = Math.PI / 2;
    innerRing.userData.materialType = 'darkConcrete';
    group.add(innerRing);

    // Outer concentric ring at dome base
    const outerRingLineGeo = new THREE.TorusGeometry(diskRadius * 0.88, 0.04, 8, numSeg);
    const outerRingLine = new THREE.Mesh(outerRingLineGeo);
    outerRingLine.position.y = spokeOuterY;
    outerRingLine.rotation.x = Math.PI / 2;
    outerRingLine.userData.materialType = 'darkConcrete';
    group.add(outerRingLine);

    // Observatory interior warm light (visible through window band)
    const obsLight = new THREE.PointLight(0xffe0b0, 1.0, 8);
    obsLight.position.y = -this.H + supportHeight + concreteBaseH + windowBandH / 2;
    obsLight.castShadow = false;
    group.add(obsLight);
  }
}
