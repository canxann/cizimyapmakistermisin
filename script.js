/* =========================================
   FLOWERS FOR YOU
   Mouse + Touch Flower Trail
========================================= */


/* =========================
   AYARLAR
========================= */

const scene = document.getElementById("scene");
const ring = document.getElementById("flowerRing");
const cursorFlowers =
    document.getElementById("cursorFlowers");


/* Mouse/parmak konumu */

let pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};

let lastPointer = {
    x: pointer.x,
    y: pointer.y
};


/* =========================
   ÇİÇEK OLUŞTURMA
========================= */

function createFlower(className, size = 50) {

    const flower = document.createElement("div");

    flower.className = className;

    flower.style.setProperty(
        "--size",
        `${size}px`
    );

    flower.style.setProperty(
        "--rotation",
        `${Math.random() * 40 - 20}deg`
    );


    /* 5-7 yaprak */

    const petalCount =
        Math.floor(Math.random() * 3) + 5;


    for (let i = 0; i < petalCount; i++) {

        const petal =
            document.createElement("div");

        petal.className = "petal";

        petal.style.setProperty(
            "--angle",
            `${(360 / petalCount) * i}deg`
        );

        flower.appendChild(petal);
    }


    /* Merkez */

    const center =
        document.createElement("div");

    center.className =
        "flower-center";

    flower.appendChild(center);


    return flower;
}


/* =========================
   HALKA ÇİÇEKLERİ
========================= */

function createRingFlowers() {

    const count =
        window.innerWidth < 600
            ? 32
            : 45;


    for (let i = 0; i < count; i++) {

        const flower =
            createFlower(
                "ring-flower",
                25 + Math.random() * 50
            );


        const angle =
            (360 / count) * i
            + Math.random() * 8;


        /*
          Elips şeklinde halka
        */

        const radiusX =
            window.innerWidth < 600
                ? 47
                : 48;

        const radiusY =
            window.innerWidth < 600
                ? 43
                : 46;


        const x =
            50 +
            Math.cos(
                angle * Math.PI / 180
            ) * radiusX;


        const y =
            50 +
            Math.sin(
                angle * Math.PI / 180
            ) * radiusY;


        flower.style.setProperty(
            "--x",
            `${x}%`
        );

        flower.style.setProperty(
            "--y",
            `${y}%`
        );


        flower.style.setProperty(
            "--opacity",
            `${0.65 + Math.random() * .35}`
        );


        flower.style.setProperty(
            "--duration",
            `${2 + Math.random() * 3}s`
        );


        ring.appendChild(flower);
    }
}


createRingFlowers();


/* =========================
   TAKİP ÇİÇEKLERİ
========================= */

const trail = [];

const TRAIL_COUNT =
    window.innerWidth < 600
        ? 16
        : 22;


for (let i = 0; i < TRAIL_COUNT; i++) {

    const flower =
        createFlower(
            "cursor-flower",
            20 + Math.random() * 35
        );


    /*
      İlk çiçek büyük,
      arkadakiler daha küçük
    */

    const scale =
        1 -
        (i / TRAIL_COUNT) * .45;


    flower.dataset.index = i;

    flower.style.setProperty(
        "--size",
        `${(25 + Math.random() * 35) * scale}px`
    );


    flower.style.setProperty(
        "--rotation",
        `${Math.random() * 360}deg`
    );


    cursorFlowers.appendChild(flower);

    trail.push({
        element: flower,

        x: pointer.x,
        y: pointer.y,

        targetX: pointer.x,
        targetY: pointer.y,

        speed:
            0.18 +
            (1 - i / TRAIL_COUNT) * .12,

        life: 0
    });
}


/* =========================
   POINTER
   Mouse + Touch
========================= */

window.addEventListener(
    "pointermove",
    (event) => {

        pointer.x = event.clientX;
        pointer.y = event.clientY;

    },
    {
        passive: true
    }
);


/*
  Parmağı ekrana koyduğunda
  çiçekleri hemen göster.
*/

window.addEventListener(
    "pointerdown",
    (event) => {

        pointer.x = event.clientX;
        pointer.y = event.clientY;

        trail.forEach((flower) => {
            flower.life = 1;
        });

    },
    {
        passive: true
    }
);


/*
  Parmak ekrandan kalkınca
  çiçekler kaybolsun.
*/

window.addEventListener(
    "pointerup",
    () => {

        trail.forEach((flower) => {
            flower.life = 0;
        });

    },
    {
        passive: true
    }
);


/* =========================
   ANİMASYON
========================= */

function animate() {

    /*
      İlk çiçek mouse/parmağı takip eder.
    */

    let targetX = pointer.x;
    let targetY = pointer.y;


    trail.forEach((flower, index) => {

        flower.targetX = targetX;
        flower.targetY = targetY;


        /*
          Yumuşak takip
        */

        flower.x +=
            (flower.targetX - flower.x)
            * flower.speed;


        flower.y +=
            (flower.targetY - flower.y)
            * flower.speed;


        /*
          Hafif doğal hareket
        */

        const wave =
            Math.sin(
                performance.now() * 0.002
                + index
            ) * 1.5;


        flower.element.style.left =
            `${flower.x}px`;


        flower.element.style.top =
            `${flower.y + wave}px`;


        /*
          Mouse hareket ediyorsa görünür,
          yoksa yavaşça kaybolur.
        */

        const distance =
            Math.hypot(
                pointer.x - lastPointer.x,
                pointer.y - lastPointer.y
            );


        if (distance > 0.5) {
            flower.life += .06;
        } else {
            flower.life -= .015;
        }


        flower.life =
            Math.max(
                0,
                Math.min(1, flower.life)
            );


        flower.element.style.opacity =
            flower.life;


        /*
          Hafif dönme
        */

        const rotation =
            Math.sin(
                performance.now() * .001
                + index
            ) * 8;


        flower.element.style.transform =
            `translate(-50%, -50%)
             rotate(${rotation}deg)`;


        /*
          Bir sonraki çiçek,
          öncekini takip eder.
        */

        targetX = flower.x;
        targetY = flower.y;
    });


    lastPointer.x +=
        (pointer.x - lastPointer.x) * .15;

    lastPointer.y +=
        (pointer.y - lastPointer.y) * .15;


    requestAnimationFrame(animate);
}


animate();


/* =========================
   EKRAN BOYUTU DEĞİŞİNCE
========================= */

window.addEventListener(
    "resize",
    () => {

        /*
          Sayfayı yenilemeden
          konumu güncelle.
        */

        pointer.x =
            window.innerWidth / 2;

        pointer.y =
            window.innerHeight / 2;
    }
);
