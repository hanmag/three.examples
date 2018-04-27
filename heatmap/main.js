var group;
var container, stats;
var particlesData = [];
var camera, scene, renderer;
var positions, colors, opacities;
var particles, randomParticles;
var pointCloud;
var particlePositions;
var heatMesh;
var material;
var maxParticleCount = 100;
var particleCount = 30;
var heatmapParticleIndex = {};
var heatmapParticleCell = 10;
var heatmapParticleUnit = 20;
var r = 800;
var rHalf = r / 2;

var effectController = {
    showDots: true,
    minDistance: 100,
    particleCount: 30,
    color: 'RGB1'
};

init();
animate();

function initGUI() {

    var gui = new dat.GUI();

    gui.add(effectController, "showDots").onChange(function (value) {

        pointCloud.visible = value;

    });
    gui.add(effectController, "minDistance", 1, 200);
    gui.add(effectController, "particleCount", 1, maxParticleCount, 1).onChange(function (value) {

        particleCount = parseInt(value);
        particles.setDrawRange(0, particleCount);

    });
    gui.add(effectController, 'color', ['RGB1', 'RGB2', 'RGB3', 'Grey']);
}

function init() {

    initGUI();

    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.z = 1750;

    var controls = new THREE.OrbitControls(camera, container);

    scene = new THREE.Scene();


    group = new THREE.Group();
    scene.add(group);

    var helper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(r, r, r)));
    helper.material.color.setHex(0x080808);
    helper.material.blending = THREE.AdditiveBlending;
    helper.material.transparent = true;
    group.add(helper);

    var dlen = r / heatmapParticleCell;
    for (var i = 0; i < heatmapParticleCell; i++) {
        for (var j = 0; j < heatmapParticleCell; j++) {
            for (var k = 0; k < heatmapParticleCell; k++) {
                var x = ((i + 0.5) * dlen) - r / 2;
                var y = ((j + 0.5) * dlen) - r / 2;
                var z = ((k + 0.5) * dlen) - r / 2;
                var id = i + '-' + j + '-' + k;
                var hmpoints = [];

                for (var l = 0; l < heatmapParticleUnit; l++) {
                    var dx = Math.random() * dlen - dlen / 2 + x;
                    var dy = Math.random() * dlen - dlen / 2 + y;
                    var dz = Math.random() * dlen - dlen / 2 + z;
                    hmpoints.push([dx, dy, dz]);
                }

                heatmapParticleIndex[id] = {
                    "center": [x, y, z],
                    "points": hmpoints
                };
            }
        }
    }

    var heatmapCount = heatmapParticleCell * heatmapParticleCell * heatmapParticleCell * heatmapParticleUnit;
    positions = new Float32Array(heatmapCount * 3);
    colors = new Float32Array(heatmapCount * 3);
    opacities = new Float32Array(heatmapCount);
    console.log(heatmapCount);

    var pMaterial = new THREE.PointsMaterial({
        color: 0x888888,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array(maxParticleCount * 3);

    for (var i = 0; i < maxParticleCount; i++) {

        var x = Math.random() * r - r / 2;
        var y = Math.random() * r - r / 2;
        var z = Math.random() * r - r / 2;

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        // add it to the geometry
        particlesData.push({
            velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2)
        });

    }

    particles.setDrawRange(0, particleCount);
    particles.addAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setDynamic(true));

    // create the particle system
    pointCloud = new THREE.Points(particles, pMaterial);
    group.add(pointCloud);

    var geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));
    geometry.addAttribute('opacity', new THREE.BufferAttribute(opacities, 1).setDynamic(true));

    geometry.computeBoundingSphere();

    geometry.setDrawRange(0, 0);

    // 粒子材质
    material = new THREE.ShaderMaterial({
        uniforms: {
            size: {
                value: window.innerHeight * 0.042 * window.devicePixelRatio
            },
            texture: {
                value: new THREE.TextureLoader().load("../textures/particle2.png")
            }
        },
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,

        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    });

    heatMesh = new THREE.Points(geometry, material);
    group.add(heatMesh);

    //

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    container.appendChild(renderer.domElement);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    material.uniforms.size.value = window.innerHeight * 0.042 * window.devicePixelRatio;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

}

function colorful(alpha) {
    switch (effectController.color) {
        case 'Grey':
            return [0.5, 0.5, 0.5];
        case 'RGB1':
            return [alpha, alpha > 0.5 ? 2 - 2 * alpha : 2 * alpha, 1 - alpha];
        case 'RGB2':
            return [alpha, 2 * Math.abs(0.5 - alpha), 1 - alpha];
        case 'RGB3':
            return [alpha, 1 - alpha, 2 * Math.abs(0.5 - alpha)];
    }
}

function animate() {

    var vertexpos = 0;
    var colorpos = 0;
    var opacitypos = 0;
    var updated = false;

    // calculate heatmap
    for (var index in heatmapParticleIndex) {
        if (heatmapParticleIndex.hasOwnProperty(index)) {
            var element = heatmapParticleIndex[index];
            var queue = [];
            var particleDataB = element.center;

            for (var i = 0; i < particleCount; i++) {

                // get the particle
                var particleData = particlesData[i];
                if (!updated) {
                    particlePositions[i * 3] += particleData.velocity.x;
                    particlePositions[i * 3 + 1] += particleData.velocity.y;
                    particlePositions[i * 3 + 2] += particleData.velocity.z;

                    if (particlePositions[i * 3 + 1] < -rHalf || particlePositions[i * 3 + 1] > rHalf)
                        particleData.velocity.y = -particleData.velocity.y;

                    if (particlePositions[i * 3] < -rHalf || particlePositions[i * 3] > rHalf)
                        particleData.velocity.x = -particleData.velocity.x;

                    if (particlePositions[i * 3 + 2] < -rHalf || particlePositions[i * 3 + 2] > rHalf)
                        particleData.velocity.z = -particleData.velocity.z;
                }

                var dx = particlePositions[i * 3] - particleDataB[0];
                var dy = particlePositions[i * 3 + 1] - particleDataB[1];
                var dz = particlePositions[i * 3 + 2] - particleDataB[2];
                var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < effectController.minDistance * 1.2) {
                    queue.push(i);
                }
            }

            updated = true;

            if (queue.length > 0) {
                element.points.forEach(point => {
                    var alpha = 0;

                    queue.forEach(pd => {
                        var ddx = particlePositions[pd * 3] - point[0];
                        var ddy = particlePositions[pd * 3 + 1] - point[1];
                        var ddz = particlePositions[pd * 3 + 2] - point[2];
                        var ddist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);

                        if (ddist < effectController.minDistance) {
                            alpha += 1.0 - ddist / effectController.minDistance;
                        }
                    });

                    if (alpha > 0.01) {
                        positions[vertexpos++] = point[0];
                        positions[vertexpos++] = point[1];
                        positions[vertexpos++] = point[2];

                        var color = colorful(alpha);
                        colors[colorpos++] = color[0];
                        colors[colorpos++] = color[1];
                        colors[colorpos++] = color[2];

                        opacities[opacitypos++] = alpha;
                    }
                });
            }
        }
    }

    // console.log(opacitypos);
    heatMesh.geometry.setDrawRange(0, opacitypos);
    heatMesh.geometry.attributes.position.needsUpdate = true;
    heatMesh.geometry.attributes.color.needsUpdate = true;
    heatMesh.geometry.attributes.opacity.needsUpdate = true;

    pointCloud.geometry.attributes.position.needsUpdate = true;

    requestAnimationFrame(animate);

    stats.update();
    render();

}

function render() {

    var time = Date.now() * 0.001;

    group.rotation.y = time * 0.1;
    renderer.render(scene, camera);

}