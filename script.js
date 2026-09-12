const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");


const tutorial =
    document.getElementById("tutorial");

const targetLetter =
    document.getElementById("targetLetter");

const tutorialProgress =
    document.getElementById(
        "tutorialProgress"
    );

const message =
    document.getElementById("message");

const clearButton =
    document.getElementById(
        "clearButton"
    );


/* =========================================
   AYARLAR
========================================= */

const FLOWER_DISTANCE = 13;

const MIN_FLOWER_SIZE = 11;
const MAX_FLOWER_SIZE = 23;

const MAX_FLOWERS = 1100;

const FLOWER_LIFE = 8500;

const FADE_TIME = 1300;


/*
 * Kullanıcının hedef çizgiye
 * yaklaşabileceği tolerans.
 */
const LETTER_TOLERANCE = 48;


/*
 * Bir harfin tamamlanması için
 * gereken oran.
 */
const REQUIRED_PROGRESS = .82;


/*
 * Tutorial metni.
 */
const TUTORIAL_TEXT =
    "VALORANT GIRL PICK ME OLMA";


/* =========================================
   DURUM
========================================= */

let tutorialIndex = 0;

let tutorialDone = false;

let currentLetter = null;

let letterProgress = 0;

let drawing = false;

let activePointer = null;

let lastX = 0;
let lastY = 0;

let distanceSinceFlower = 0;

const flowers = [];


/* =========================================
   CANVAS
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


function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


function easeOutCubic(t) {

    return 1 -
        Math.pow(
            1 - t,
            3
        );
}


function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


/* =========================================
   SES
========================================= */

let audioContext = null;


function initAudio() {

    if (!audioContext) {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {
            return;
        }


        audioContext =
            new AudioContext();
    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }
}


function playPop() {

    if (!audioContext) {
        return;
    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type = "sine";


    oscillator.frequency
        .setValueAtTime(
            480,
            now
        );


    oscillator.frequency
        .exponentialRampToValueAtTime(
            760,
            now + .08
        );


    gain.gain
        .setValueAtTime(
            .0001,
            now
        );


    gain.gain
        .exponentialRampToValueAtTime(
            .075,
            now + .015
        );


    gain.gain
        .exponentialRampToValueAtTime(
            .0001,
            now + .13
        );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start(now);

    oscillator.stop(
        now + .14
    );
}


function playSuccess() {

    if (!audioContext) {
        return;
    }


    const now =
        audioContext.currentTime;


    [0, .09, .18].forEach(
        (offset, index) => {

            const oscillator =
                audioContext
                    .createOscillator();

            const gain =
                audioContext
                    .createGain();


            oscillator.type =
                "sine";


            oscillator.frequency
                .setValueAtTime(
                    [520, 660, 820][index],
                    now + offset
                );


            gain.gain
                .setValueAtTime(
                    .0001,
                    now + offset
                );


            gain.gain
                .exponentialRampToValueAtTime(
                    .07,
                    now + offset + .02
                );


            gain.gain
                .exponentialRampToValueAtTime(
                    .0001,
                    now + offset + .15
                );


            oscillator.connect(gain);

            gain.connect(
                audioContext.destination
            );


            oscillator.start(
                now + offset
            );


            oscillator.stop(
                now + offset + .16
            );
        }
    );
}


/* =========================================
   ÇİÇEK
========================================= */

function addFlower(
    x,
    y,
    size = null
) {

    if (
        flowers.length >=
        MAX_FLOWERS
    ) {

        flowers.shift();
    }


    flowers.push({

        x,

        y,

        size:
            size ??
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
                .78,
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
   ÇİÇEK PATLAMASI
========================================= */

function flowerBurst(
    x,
    y
) {

    addFlower(
        x,
        y,
        38
    );


    const count = 20;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            (
                Math.PI * 2 /
                count
            ) * i;


        const radius =
            random(
                35,
                100
            );


        addFlower(
            x +
            Math.cos(angle) *
            radius,

            y +
            Math.sin(angle) *
            radius,

            random(
                11,
                27
            )
        );
    }


    for (
        let i = 0;
        i < 9;
        i++
    ) {

        const angle =
            random(
                0,
                Math.PI * 2
            );


        const radius =
            random(
                100,
                145
            );


        addFlower(
            x +
            Math.cos(angle) *
            radius,

            y +
            Math.sin(angle) *
            radius,

            random(
                7,
                14
            )
        );
    }
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


    if (
        age >=
        FLOWER_LIFE
    ) {

        return;
    }


    const birth =
        easeOutCubic(
            Math.min(
                age / 220,
                1
            )
        );


    let alpha = 1;


    if (
        age >
        FLOWER_LIFE -
        FADE_TIME
    ) {

        alpha =
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


    const pulse =
        1 +
        Math.sin(
            time * .0015 +
            flower.phase
        ) * .025;


    const scale =
        birth *
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
        alpha;


    ctx.shadowColor =
        "rgba(100,40,90,.18)";


    ctx.shadowBlur = 5;

    ctx.shadowOffsetY = 2;


    const petals = 5;


    for (
        let i = 0;
        i < petals;
        i++
    ) {

        ctx.save();


        ctx.rotate(
            i *
            Math.PI * 2 /
            petals
        );


        const hue =
            328 +
            flower.hue;


        const gradient =
            ctx.createLinearGradient(
                0,
                -size * .1,
                0,
                -size
            );


        gradient.addColorStop(
            0,
            `hsl(${hue},66%,78%)`
        );


        gradient.addColorStop(
            .5,
            `hsl(${hue - 2},63%,72%)`
        );


        gradient.addColorStop(
            1,
            `hsl(${hue + 4},60%,88%)`
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();


        ctx.moveTo(
            0,
            -size * .12
        );


        ctx.bezierCurveTo(
            -size * .45,
            -size * .42,

            -size * .48,
            -size * .88,

            0,
            -size
        );


        ctx.bezierCurveTo(
            size * .48,
            -size * .88,

            size * .45,
            -size * .42,

            0,
            -size * .12
        );


        ctx.fill();


        ctx.restore();
    }


    ctx.shadowBlur = 3;


    const center =
        ctx.createRadialGradient(
            0,
            0,
            1,
            0,
            0,
            size * .27
        );


    center.addColorStop(
        0,
        "#fff0bb"
    );


    center.addColorStop(
        .55,
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
        size * .23,
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


    for (
        let i =
            flowers.length - 1;

        i >= 0;

        i--
    ) {

        const flower =
            flowers[i];


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
   HARF HEDEFLERİ
========================================= */

/*
 * Her harf normalize edilmiş
 * koordinatlardan oluşuyor.
 *
 * x: -1 ile +1
 * y: -1 ile +1
 *
 * Böylece ekran boyutundan
 * bağımsız çalışıyor.
 */

const LETTERS = {

    V: [
        [
            [-.55, -.65],
            [0, .65],
            [.55, -.65]
        ]
    ],


    A: [
        [
            [-.55, .65],
            [0, -.65],
            [.55, .65]
        ],
        [
            [-.32, .05],
            [.32, .05]
        ]
    ],


    L: [
        [
            [-.45, -.65],
            [-.45, .65],
            [.55, .65]
        ]
    ],


    O: [
        [
            [0, -.65],
            [.42, -.52],
            [.58, 0],
            [.42, .52],
            [0, .65],
            [-.42, .52],
            [-.58, 0],
            [-.42, -.52],
            [0, -.65]
        ]
    ],


    R: [
        [
            [-.45, .65],
            [-.45, -.65],
            [.15, -.65],
            [.48, -.48],
            [.15, 0],
            [-.45, 0]
        ],
        [
            [.12, 0],
            [.55, .65]
        ]
    ],


    N: [
        [
            [-.5, .65],
            [-.5, -.65],
            [.5, .65],
            [.5, -.65]
        ]
    ],


    T: [
        [
            [-.58, -.65],
            [.58, -.65]
        ],
        [
            [0, -.65],
            [0, .65]
        ]
    ],


    G: [
        [
            [.5, -.45],
            [.25, -.65],
            [-.25, -.65],
            [-.55, -.35],
            [-.55, .35],
            [-.25, .65],
            [.3, .65],
            [.5, .38],
            [.5, .05],
            [.05, .05]
        ]
    ],


    P: [
        [
            [-.45, .65],
            [-.45, -.65],
            [.2, -.65],
            [.5, -.45],
            [.2, -.05],
            [-.45, -.05]
        ]
    ],


    I: [
        [
            [-.35, -.65],
            [.35, -.65]
        ],
        [
            [0, -.65],
            [0, .65]
        ],
        [
            [-.35, .65],
            [.35, .65]
        ]
    ],


    C: [
        [
            [.52, -.48],
            [.2, -.65],
            [-.3, -.65],
            [-.55, -.35],
            [-.55, .35],
            [-.3, .65],
            [.2, .65],
            [.52, .48]
        ]
    ],


    K: [
        [
            [-.45, -.65],
            [-.45, .65]
        ],
        [
            [.5, -.65],
            [-.45, 0],
            [.55, .65]
        ]
    ],


    E: [
        [
            [.5, -.65],
            [-.5, -.65],
            [-.5, .65],
            [.5, .65]
        ],
        [
            [-.5, 0],
            [.3, 0]
        ]
    ],


    M: [
        [
            [-.58, .65],
            [-.58, -.65],
            [0, .05],
            [.58, -.65],
            [.58, .65]
        ]
    ]
};


/* =========================================
   AKTİF HARFİN EKRAN KOORDİNATLARI
========================================= */

function getLetterTransform() {

    const width =
        Math.min(
            window.innerWidth * .62,
            390
        );


    const height =
        Math.min(
            window.innerHeight * .46,
            330
        );


    const cx =
        window.innerWidth / 2;


    const cy =
        window.innerHeight / 2;


    return {
        cx,
        cy,
        width,
        height
    };
}


function normalizedToScreen(
    point
) {

    const {
        cx,
        cy,
        width,
        height
    } =
        getLetterTransform();


    return {
        x:
            cx +
            point[0] *
            width,

        y:
            cy +
            point[1] *
            height
    };
}


/* =========================================
   HARFİ HAZIRLA
========================================= */

function loadLetter() {

    if (
        tutorialIndex >=
        TUTORIAL_TEXT.length
    ) {

        finishTutorial();

        return;
    }


    const character =
        TUTORIAL_TEXT[
            tutorialIndex
        ];


    /*
     * Boşlukları kullanıcıya
     * çizdirmiyoruz.
     */
    if (
        character === " "
    ) {

        tutorialIndex++;

        loadLetter();

        return;
    }


    currentLetter =
        LETTERS[character];


    letterProgress = 0;


    targetLetter.textContent =
        character;


    targetLetter.classList.remove(
        "visible"
    );


    tutorialProgress.textContent =
        `${tutorialIndex + 1} / ${countLetters()}`;


    requestAnimationFrame(
        () => {

            targetLetter.classList.add(
                "visible"
            );
        }
    );
}


/* =========================================
   HARF SAYISI
========================================= */

function countLetters() {

    return TUTORIAL_TEXT
        .replaceAll(" ", "")
        .length;
}


/* =========================================
   NOKTANIN HARFE UZAKLIĞI
========================================= */

function pointToSegmentDistance(
    px,
    py,
    ax,
    ay,
    bx,
    by
) {

    const abx =
        bx - ax;

    const aby =
        by - ay;


    const abLength =
        abx * abx +
        aby * aby;


    if (
        abLength === 0
    ) {

        return Math.hypot(
            px - ax,
            py - ay
        );
    }


    let t =
        (
            (px - ax) * abx +
            (py - ay) * aby
        ) /
        abLength;


    t =
        clamp(
            t,
            0,
            1
        );


    const x =
        ax +
        abx * t;


    const y =
        ay +
        aby * t;


    return Math.hypot(
        px - x,
        py - y
    );
}


/* =========================================
   HARF ÜZERİNDE Mİ?
========================================= */

function getNearestLetterPoint(
    x,
    y
) {

    if (!currentLetter) {
        return null;
    }


    let closest = null;


    for (
        let strokeIndex = 0;
        strokeIndex <
        currentLetter.length;
        strokeIndex++
    ) {

        const stroke =
            currentLetter[
                strokeIndex
            ];


        for (
            let i = 0;
            i <
            stroke.length - 1;
            i++
        ) {

            const a =
                normalizedToScreen(
                    stroke[i]
                );


            const b =
                normalizedToScreen(
                    stroke[i + 1]
                );


            const d =
                pointToSegmentDistance(
                    x,
                    y,
                    a.x,
                    a.y,
                    b.x,
                    b.y
                );


            if (
                !closest ||
                d < closest.distance
            ) {

                closest = {
                    distance: d,
                    strokeIndex,
                    segmentIndex: i
                };
            }
        }
    }


    return closest;
}


/* =========================================
   HARF İLERLEMESİ
========================================= */

function updateLetterProgress(
    x,
    y
) {

    const nearest =
        getNearestLetterPoint(
            x,
            y
        );


    if (!nearest) {
        return;
    }


    /*
     * Kullanıcı hedef çizgiye
     * yeterince yakınsa ilerle.
     */
    if (
        nearest.distance >
        LETTER_TOLERANCE
    ) {

        return;
    }


    /*
     * Harfin bütün parçalarının
     * toplam uzunluğunu hesapla.
     */
    const total =
        getLetterTotalLength();


    /*
     * Kullanıcının bulunduğu
     * segmentten tahmini ilerleme.
     */
    let passed = 0;


    for (
        let s = 0;
        s < nearest.strokeIndex;
        s++
    ) {

        passed +=
            getStrokeLength(
                currentLetter[s]
            );
    }


    const stroke =
        currentLetter[
            nearest.strokeIndex
        ];


    for (
        let i = 0;
        i < nearest.segmentIndex;
        i++
    ) {

        const a =
            normalizedToScreen(
                stroke[i]
            );


        const b =
            normalizedToScreen(
                stroke[i + 1]
            );


        passed +=
            distance(
                a.x,
                a.y,
                b.x,
                b.y
            );
    }


    /*
     * Bulunduğumuz segmente
     * yakınlık da ilerlemeye ekleniyor.
     */
    const a =
        normalizedToScreen(
            stroke[
                nearest.segmentIndex
            ]
        );


    const b =
        normalizedToScreen(
            stroke[
                nearest.segmentIndex + 1
            ]
        );


    const segmentLength =
        distance(
            a.x,
            a.y,
            b.x,
            b.y
        );


    const segmentProgress =
        1 -
        clamp(
            nearest.distance /
            Math.max(
                segmentLength,
                1
            ),
            0,
            1
        );


    passed +=
        segmentLength *
        segmentProgress;


    const progress =
        clamp(
            passed / total,
            0,
            1
        );


    /*
     * Sadece ileri doğru ilerle.
     */
    letterProgress =
        Math.max(
            letterProgress,
            progress
        );


    if (
        letterProgress >=
        REQUIRED_PROGRESS
    ) {

        completeLetter();
    }
}


/* =========================================
   STROKE UZUNLUĞU
========================================= */

function getStrokeLength(
    stroke
) {

    let total = 0;


    for (
        let i = 0;
        i < stroke.length - 1;
        i++
    ) {

        const a =
            normalizedToScreen(
                stroke[i]
            );


        const b =
            normalizedToScreen(
                stroke[i + 1]
            );


        total +=
            distance(
                a.x,
                a.y,
                b.x,
                b.y
            );
    }


    return total;
}


function getLetterTotalLength() {

    let total = 0;


    for (
        const stroke
        of currentLetter
    ) {

        total +=
            getStrokeLength(
                stroke
            );
    }


    return total;
}


/* =========================================
   HARF TAMAMLANDI
========================================= */

async function completeLetter() {

    if (!currentLetter) {
        return;
    }


    /*
     * Aynı harfin iki kere
     * tamamlanmasını engelle.
     */
    const completedLetter =
        TUTORIAL_TEXT[
            tutorialIndex
        ];


    currentLetter = null;


    /*
     * Harfin ortasına patlama.
     */
    const {
        cx,
        cy
    } =
        getLetterTransform();


    flowerBurst(
        cx,
        cy
    );


    playPop();


    /*
     * Hedef harfi kısa süre
     * parlat.
     */
    targetLetter.classList.remove(
        "visible"
    );


    await wait(230);


    tutorialIndex++;


    loadLetter();
}


/* =========================================
   TUTORIAL BİTİŞİ
========================================= */

async function finishTutorial() {

    tutorialDone = true;


    targetLetter.classList.remove(
        "visible"
    );


    tutorialProgress.textContent =
        "";


    await wait(350);


    flowerBurst(
        window.innerWidth / 2,
        window.innerHeight / 2
    );


    playSuccess();


    await wait(700);


    tutorial.classList.add(
        "finished"
    );


    await wait(600);


    message.classList.add(
        "show"
    );


    clearButton.classList.add(
        "show"
    );
}


/* =========================================
   ÇİZGİ
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


            distanceSinceFlower =
                distanceSinceFlower -
                FLOWER_DISTANCE;


            lastX =
                flowerX;


            lastY =
                flowerY;
        }


        lastX = x;

        lastY = y;


        /*
         * Tutorial açıksa
         * harf kontrolü.
         */
        if (
            !tutorialDone
        ) {

            updateLetterProgress(
                x,
                y
            );
        }
    }
}


/* =========================================
   ÇİZİME BAŞLA
========================================= */

function startDrawing(event) {

    /*
     * Tutorial bitmeden
     * normal çizim yok.
     */
    if (
        tutorialDone === false &&
        currentLetter === null
    ) {

        return;
    }


    /*
     * Ses için kullanıcı etkileşimi.
     */
    initAudio();


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
     * Tutorial harfi çiziliyorsa
     * normal çiçekleri de üret.
     */
    addFlower(
        lastX,
        lastY,
        tutorialDone
            ? null
            : 7
    );


    try {

        canvas.setPointerCapture(
            event.pointerId
        );

    } catch (error) {}
}


/* =========================================
   HAREKET
========================================= */

function moveDrawing(event) {

    if (
        !drawing
    ) {

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

    if (
        !drawing
    ) {

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


canvas.addEventListener(
    "pointercancel",
    stopDrawing
);


/* =========================================
   TEMİZLE
========================================= */

clearButton.addEventListener(
    "click",
    () => {

        flowers.length = 0;

        distanceSinceFlower = 0;

        drawing = false;

        activePointer = null;
    }
);


/* =========================================
   BAŞLAT
========================================= */

loadLetter();
