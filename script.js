const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const message = document.getElementById("message");
const clearButton = document.getElementById("clearButton");


/* =========================================
   AYARLAR
========================================= */

/*
 * Çiçekler arasındaki mesafe.
 *
 * Küçültürsen daha sık çiçek oluşur.
 * Büyütürsen daha seyrek olur.
 */
const FLOWER_DISTANCE = 13;


/*
 * Çiçek boyutları.
 */
const MIN_FLOWER_SIZE = 11;
const MAX_FLOWER_SIZE = 23;


/*
 * Aynı anda tutulabilecek maksimum çiçek.
 */
const MAX_FLOWERS = 1100;


/*
 * Çiçeğin ekranda kalma süresi.
 *
 * 8500 = 8.5 saniye
 */
const FLOWER_LIFE = 8500;


/*
 * Kaybolma süresi.
 *
 * Son 1.3 saniyede yavaşça görünmez olur.
 */
const FADE_TIME = 1300;


/* =========================================
   CANVAS BOYUTU
========================================= */

let dpr =
    Math.min(
        window.devicePixelRatio || 1,
        2
    );


function resizeCanvas() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    canvas.width =
        Math.round(
            width * dpr
        );

    canvas.height =
        Math.round(
            height * dpr
        );


    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


resizeCanvas();


window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================================
   DURUM
========================================= */

let drawing = false;

let activePointer = null;

let lastX = 0;
let lastY = 0;

let distanceSinceFlower = 0;


/*
 * Bütün çiçekler burada tutulur.
 */
const flowers = [];


/* =========================================
   YARDIMCI
========================================= */

function random(min, max) {

    return Math.random() *
        (max - min) +
        min;
}


function distance(
    x1,
    y1,
    x2,
    y2
) {

    return Math.hypot(
        x2 - x1,
        y2 - y1
    );
}


/*
 * Yumuşak animasyon.
 */
function easeOutCubic(t) {

    return 1 -
        Math.pow(
            1 - t,
            3
        );
}


/* =========================================
   ÇİÇEK EKLE
========================================= */

function addFlower(x, y) {

    /*
     * Performansı korumak için
     * maksimum sayıyı geçmiyoruz.
     */
    if (
        flowers.length >=
        MAX_FLOWERS
    ) {

        flowers.shift();
    }


    flowers.push({

        x: x,

        y: y,

        size:
            random(
                MIN_FLOWER_SIZE,
                MAX_FLOWER_SIZE
            ),

        rotation:
            random(
                0,
                Math.PI * 2
            ),

        hue:
            random(
                -8,
                8
            ),

        alpha:
            random(
                0.78,
                1
            ),

        phase:
            random(
                0,
                Math.PI * 2
            ),

        createdAt:
            performance.now()
    });
}


/* =========================================
   ÇİÇEK ÇİZ
========================================= */

function drawFlower(
    flower,
    time
) {

    const age =
        time -
        flower.createdAt;


    /*
     * Ömrü bittiyse çizme.
     */
    if (
        age >=
        FLOWER_LIFE
    ) {

        return;
    }


    /* -------------------------------------
       Çiçeğin ortaya çıkışı
    ------------------------------------- */

    const birthProgress =
        Math.min(
            age / 280,
            1
        );


    const birthScale =
        easeOutCubic(
            birthProgress
        );


    /* -------------------------------------
       Çiçeğin kaybolması
    ------------------------------------- */

    let lifeAlpha = 1;


    if (
        age >
        FLOWER_LIFE -
        FADE_TIME
    ) {

        lifeAlpha =
            1 -
            (
                age -
                (
                    FLOWER_LIFE -
                    FADE_TIME
                )
            ) /
            FADE_TIME;
    }


    /* -------------------------------------
       Hafif canlılık
    ------------------------------------- */

    const pulse =
        1 +
        Math.sin(
            time * 0.0015 +
            flower.phase
        ) * 0.025;


    const scale =
        birthScale *
        pulse;


    const size =
        flower.size;


    ctx.save();


    ctx.translate(
        flower.x,
        flower.y
    );


    ctx.rotate(
        flower.rotation
    );


    ctx.scale(
        scale,
        scale
    );


    ctx.globalAlpha =
        flower.alpha *
        lifeAlpha;


    /* -------------------------------------
       GÖLGE
    ------------------------------------- */

    ctx.shadowColor =
        "rgba(100,40,90,.20)";

    ctx.shadowBlur = 5;

    ctx.shadowOffsetY = 2;


    /* -------------------------------------
       PETALLER
    ------------------------------------- */

    const petalCount = 5;


    for (
        let i = 0;
        i < petalCount;
        i++
    ) {

        ctx.save();


        ctx.rotate(
            (
                Math.PI * 2 /
                petalCount
            ) * i
        );


        const hue =
            328 +
            flower.hue;


        const gradient =
            ctx.createLinearGradient(
                0,
                -size * 0.1,
                0,
                -size
            );


        gradient.addColorStop(
            0,
            `hsl(${hue}, 66%, 78%)`
        );


        gradient.addColorStop(
            0.5,
            `hsl(${hue - 2}, 63%, 72%)`
        );


        gradient.addColorStop(
            1,
            `hsl(${hue + 4}, 60%, 88%)`
        );


        ctx.fillStyle =
            gradient;


        /*
         * Organik petal şekli.
         */

        ctx.beginPath();


        ctx.moveTo(
            0,
            -size * 0.12
        );


        ctx.bezierCurveTo(
            -size * 0.45,
            -size * 0.42,

            -size * 0.48,
            -size * 0.88,

            0,
            -size
        );


        ctx.bezierCurveTo(
            size * 0.48,
            -size * 0.88,

            size * 0.45,
            -size * 0.42,

            0,
            -size * 0.12
        );


        ctx.fill();


        ctx.restore();
    }


    /* -------------------------------------
       ÇİÇEK MERKEZİ
    ------------------------------------- */

    ctx.shadowBlur = 3;


    const center =
        ctx.createRadialGradient(
            0,
            0,
            1,
            0,
            0,
            size * 0.27
        );


    center.addColorStop(
        0,
        "#fff0bb"
    );


    center.addColorStop(
        0.55,
        "#f4a16e"
    );


    center.addColorStop(
        1,
        "#d95f83"
    );


    ctx.fillStyle =
        center;


    ctx.beginPath();


    ctx.arc(
        0,
        0,
        size * 0.23,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.restore();
}


/* =========================================
   RENDER
========================================= */

function render(time) {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );


    /*
     * Eski çiçekleri temizle.
     */
    for (
        let i =
            flowers.length - 1;

        i >= 0;

        i--
    ) {

        const flower =
            flowers[i];


        /*
         * Çiçeğin ömrü bittiyse
         * listeden çıkar.
         */
        if (
            time -
            flower.createdAt
            >=
            FLOWER_LIFE
        ) {

            flowers.splice(
                i,
                1
            );

            continue;
        }


        drawFlower(
            flower,
            time
        );
    }


    requestAnimationFrame(
        render
    );
}


requestAnimationFrame(
    render
);


/* =========================================
   ÇİZGİ BOYUNCA ÇİÇEKLER
========================================= */

function drawLine(
    x1,
    y1,
    x2,
    y2
) {

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;


    const length =
        Math.hypot(
            dx,
            dy
        );


    if (
        length === 0
    ) {

        return;
    }


    /*
     * Çok sık ara nokta.
     *
     * Hızlı parmak hareketlerinde
     * boşluk oluşmasını engeller.
     */
    const steps =
        Math.ceil(
            length / 3
        );


    for (
        let i = 1;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;


        const x =
            x1 +
            dx * t;


        const y =
            y1 +
            dy * t;


        const segment =
            distance(
                lastX,
                lastY,
                x,
                y
            );


        distanceSinceFlower +=
            segment;


        /*
         * Çiçekler arasındaki mesafeyi
         * tam olarak koruyoruz.
         */
        while (
            distanceSinceFlower >=
            FLOWER_DISTANCE
        ) {

            const ratio =
                FLOWER_DISTANCE /
                distanceSinceFlower;


            const flowerX =
                lastX +
                (
                    x -
                    lastX
                ) *
                ratio;


            const flowerY =
                lastY +
                (
                    y -
                    lastY
                ) *
                ratio;


            addFlower(
                flowerX,
                flowerY
            );


            distanceSinceFlower -=
                FLOWER_DISTANCE;


            lastX =
                flowerX;

            lastY =
                flowerY;
        }


        lastX = x;

        lastY = y;
    }
}


/* =========================================
   ÇİZİME BAŞLA
========================================= */

function startDrawing(event) {

    /*
     * Aynı anda ikinci pointer
     * ile çizim yapılmasını engelle.
     */
    if (
        activePointer !== null
    ) {

        return;
    }


    activePointer =
        event.pointerId;


    drawing = true;


    lastX =
        event.clientX;


    lastY =
        event.clientY;


    distanceSinceFlower = 0;


    /*
     * Yazıyı gizle.
     */
    message.classList.add(
        "drawing"
    );


    /*
     * İlk çiçek.
     */
    addFlower(
        lastX,
        lastY
    );


    /*
     * Parmak/mouse canvas dışına
     * çıksa bile pointer'ı takip et.
     */
    try {

        canvas.setPointerCapture(
            event.pointerId
        );

    } catch (error) {}
}


/* =========================================
   ÇİZ
========================================= */

function moveDrawing(event) {

    if (!drawing) {
        return;
    }


    if (
        event.pointerId !==
        activePointer
    ) {

        return;
    }


    drawLine(
        lastX,
        lastY,
        event.clientX,
        event.clientY
    );
}


/* =========================================
   ÇİZİMİ BİTİR
========================================= */

function stopDrawing(event) {

    if (!drawing) {
        return;
    }


    if (
        event &&
        event.pointerId !==
        activePointer
    ) {

        return;
    }


    drawing = false;

    activePointer = null;


    /*
     * Yazıyı tekrar göstermiyoruz.
     *
     * Kullanıcı tekrar çizmeye
     * başlayana kadar gizli kalır.
     */


    try {

        if (event) {

            canvas.releasePointerCapture(
                event.pointerId
            );
        }

    } catch (error) {}
}


/* =========================================
   POINTER EVENTLERİ
========================================= */

canvas.addEventListener(
    "pointerdown",
    startDrawing
);


canvas.addEventListener(
    "pointermove",
    moveDrawing
);


canvas.addEventListener(
    "pointerup",
    stopDrawing
);


canvas.addEventListener
