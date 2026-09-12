```
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: true });

const message = document.getElementById("message");
const clearButton = document.getElementById("clearButton");

const tutorial =
    document.getElementById("tutorial");

const targetLetter =
    document.getElementById("targetLetter");

const tutorialProgress =
    document.getElementById("tutorialProgress");

/* =========================================================
   AYARLAR
========================================================= */

const TUTORIAL_TEXT =
    "VALORANT GIRL PICK ME OLMA";

const FLOWER_DISTANCE = 14;
const MAX_FLOWERS = 900;

const FLOWER_LIFE = 7000;
const FLOWER_FADE = 1200;

const LETTER_TOLERANCE = 55;
const LETTER_SAMPLE_COUNT = 180;

const MIN_FLOWER_SIZE = 10;
const MAX_FLOWER_SIZE = 22;

/* =========================================================
   DURUM
========================================================= */

let dpr = 1;

let tutorialIndex = 0;
let tutorialFinished = false;

let activeLetter = null;

let pointerDown = false;
let activePointerId = null;

let lastX = 0;
let lastY = 0;

let distanceAccumulator = 0;

let currentStroke = [];

let tutorialStrokes = [];

let flowers = [];

let completionLocked = false;

/* =========================================================
   AUDIO
========================================================= */

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
        audioContext.state === "suspended"
    ) {
        audioContext.resume();
    }
}

function playTick() {

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

    oscillator.frequency.setValueAtTime(
        560,
        now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        780,
        now + 0.08
    );

    gain.gain.setValueAtTime(
        0.0001,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        0.055,
        now + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.13
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.14);
}

function playComplete() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const notes = [
        520,
        660,
        820
    ];

    notes.forEach(
        (frequency, index) => {

            const start =
                now + index * 0.075;

            const oscillator =
                audioContext.createOscillator();

            const gain =
                audioContext.createGain();

            oscillator.type = "sine";

            oscillator.frequency.setValueAtTime(
                frequency,
                start
            );

            gain.gain.setValueAtTime(
                0.0001,
                start
            );

            gain.gain.exponentialRampToValueAtTime(
                0.07,
                start + 0.02
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                start + 0.16
            );

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start(start);
            oscillator.stop(start + 0.17);
        }
    );
}

/* =========================================================
   CANVAS
========================================================= */

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
        Math.round(width * dpr);

    canvas.height =
        Math.round(height * dpr);

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

/* =========================================================
   YARDIMCI
========================================================= */

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

function lerp(
    a,
    b,
    t
) {

    return a +
        (b - a) * t;
}

function random(
    min,
    max
) {

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

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}

/* =========================================================
   HARF GEOMETRİLERİ
========================================================= */

/*
    Her stroke ayrı bir çizgidir.

    Koordinatlar:
    -1 ... +1

    Harfler ekrana daha sonra
    responsive olarak dönüştürülür.
*/

const LETTERS = {

    V: [
        [
            [-0.58, -0.62],
            [0, 0.62],
            [0.58, -0.62]
        ]
    ],

    A: [
        [
            [-0.56, 0.62],
            [0, -0.62],
            [0.56, 0.62]
        ],
        [
            [-0.32, 0.05],
            [0.32, 0.05]
        ]
    ],

    L: [
        [
            [-0.48, -0.62],
            [-0.48, 0.62],
            [0.54, 0.62]
        ]
    ],

    O: [
        [
            [0, -0.65],
            [0.42, -0.53],
            [0.58, 0],
            [0.42, 0.53],
            [0, 0.65],
            [-0.42, 0.53],
            [-0.58, 0],
            [-0.42, -0.53],
            [0, -0.65]
        ]
    ],

    R: [
        [
            [-0.48, 0.64],
            [-0.48, -0.64],
            [0.17, -0.64],
            [0.49, -0.43],
            [0.17, -0.03],
            [-0.48, -0.03]
        ],
        [
            [0.08, -0.03],
            [0.55, 0.64]
        ]
    ],

    N: [
        [
            [-0.5, 0.64],
            [-0.5, -0.64],
            [0.5, 0.64],
            [0.5, -0.64]
        ]
    ],

    T: [
        [
            [-0.58, -0.62],
            [0.58, -0.62]
        ],
        [
            [0, -0.62],
            [0, 0.62]
        ]
    ],

    G: [
        [
            [0.52, -0.42],
            [0.25, -0.62],
            [-0.25, -0.62],
            [-0.55, -0.34],
            [-0.55, 0.34],
            [-0.25, 0.62],
            [0.30, 0.62],
            [0.52, 0.38],
            [0.52, 0.04],
            [0.04, 0.04]
        ]
    ],

    I: [
        [
            [-0.34, -0.62],
            [0.34, -0.62]
        ],
        [
            [0, -0.62],
            [0, 0.62]
        ],
        [
            [-0.34, 0.62],
            [0.34, 0.62]
        ]
    ],

    P: [
        [
            [-0.48, 0.64],
            [-0.48, -0.64],
            [0.16, -0.64],
            [0.48, -0.43],
            [0.16, -0.03],
            [-0.48, -0.03]
        ]
    ],

    C: [
        [
            [0.54, -0.46],
            [0.25, -0.64],
            [-0.25, -0.64],
            [-0.55, -0.34],
            [-0.55, 0.34],
            [-0.25, 0.64],
            [0.25, 0.64],
            [0.54, 0.46]
        ]
    ],

    K: [
        [
            [-0.48, -0.64],
            [-0.48, 0.64]
        ],
        [
            [0.48, -0.64],
            [-0.48, 0],
            [0.53, 0.64]
        ]
    ],

    E: [
        [
            [0.5, -0.64],
            [-0.5, -0.64],
            [-0.5, 0.64],
            [0.5, 0.64]
        ],
        [
            [-0.5, 0],
            [0.30, 0]
        ]
    ],

    M: [
        [
            [-0.56, 0.64],
            [-0.56, -0.64],
            [0, 0],
            [0.56, -0.64],
            [0.56, 0.64]
        ]
    ]
};

/* =========================================================
   HARF BOYUTU
========================================================= */

function getLetterBox() {

    const width =
        Math.min(
            window.innerWidth * 0.58,
            360
        );

    const height =
        Math.min(
            window.innerHeight * 0.42,
            300
        );

    return {

        cx:
            window.innerWidth / 2,

        cy:
            window.innerHeight / 2,

        width,

        height
    };
}

function toScreen(point) {

    const box =
        getLetterBox();

    return {

        x:
            box.cx +
            point[0] *
            box.width,

        y:
            box.cy +
            point[1] *
            box.height
    };
}

/* =========================================================
   HARF ÖRNEKLERİ
========================================================= */

function sampleStroke(
    stroke,
    count = LETTER_SAMPLE_COUNT
) {

    const points = [];

    const lengths = [];

    let totalLength = 0;

    for (
        let i = 0;
        i < stroke.length - 1;
        i++
    ) {

        const a =
            toScreen(
                stroke[i]
            );

        const b =
            toScreen(
                stroke[i + 1]
            );

        const len =
            distance(
                a.x,
                a.y,
                b.x,
                b.y
            );

        lengths.push(len);

        totalLength += len;
    }

    if (
        totalLength === 0
    ) {
        return points;
    }

    for (
        let s = 0;
        s < count;
        s++
    ) {

        const target =
            totalLength *
            (
                s /
                (count - 1)
            );

        let accumulated = 0;

        let segment = 0;

        for (
            let i = 0;
            i < lengths.length;
            i++
        ) {

            if (
                accumulated +
                lengths[i] >=
                target
            ) {

                segment = i;

                break;
            }

            accumulated +=
                lengths[i];
        }

        const a =
            toScreen(
                stroke[segment]
            );

        const b =
            toScreen(
                stroke[segment + 1]
            );

        const len =
            lengths[segment];

        const local =
            len === 0
                ? 0
                : (
                    target -
                    accumulated
                ) / len;

        points.push({

            x:
                lerp(
                    a.x,
                    b.x,
                    local
                ),

            y:
                lerp(
                    a.y,
                    b.y,
                    local
                )
        });
    }

    return points;
}

/* =========================================================
   HEDEF SAMPLE
========================================================= */

function buildTargetSamples() {

    if (!activeLetter) {
        return [];
    }

    return activeLetter.map(
        stroke =>
            sampleStroke(
                stroke
            )
    );
}

/* =========================================================
   KULLANICI STROKE ÖRNEKLERİ
========================================================= */

function getUserSamples() {

    const result = [];

    for (
        const stroke
        of tutorialStrokes
    ) {

        if (
            stroke.length < 2
        ) {
            continue;
        }

        /*
         * Kullanıcı çizgisini
         * hafif örnekliyoruz.
         */
        const step =
            Math.max(
                1,
                Math.floor(
                    stroke.length /
                    90
                )
            );

        for (
            let i = 0;
            i < stroke.length;
            i += step
        ) {

            result.push(
                stroke[i]
            );
        }
    }

    return result;
}

/* =========================================================
   NOKTA - SEGMENT
========================================================= */

function pointSegmentDistance(
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

    const lengthSquared =
        abx * abx +
        aby * aby;

    if (
        lengthSquared === 0
    ) {

        return Math.hypot(
            px - ax,
            py - ay
        );
    }

    const t =
        clamp(
            (
                (px - ax) * abx +
                (py - ay) * aby
            ) /
            lengthSquared,

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

/* =========================================================
   KULLANICI NOKTASININ HEDEFE UZAKLIĞI
========================================================= */

function pointToTargetDistance(
    point,
    targetSamples
) {

    let best =
        Infinity;

    for (
        const target
        of targetSamples
    ) {

        for (
            const p
            of target
        ) {

            const d =
                distance(
                    point.x,
                    point.y,
                    p.x,
                    p.y
                );

            if (
                d < best
            ) {

                best = d;
            }
        }
    }

    return best;
}

/* =========================================================
   COVERAGE
========================================================= */

function calculateCoverage() {

    if (!activeLetter) {
        return 0;
    }

    const targetSamples =
        buildTargetSamples();

    const userSamples =
        getUserSamples();

    if (
        userSamples.length < 10
    ) {

        return 0;
    }

    /*
     * Her hedef stroke'unun
     * ayrı ayrı ne kadarının
     * kullanıcı tarafından
     * kaplandığını hesapla.
     */

    let totalTarget = 0;

    let coveredTarget = 0;

    for (
        const stroke
        of targetSamples
    ) {

        for (
            const targetPoint
            of stroke
        ) {

            totalTarget++;

            let nearest =
                Infinity;

            for (
                const userPoint
                of userSamples
            ) {

                const d =
                    distance(
                        targetPoint.x,
                        targetPoint.y,
                        userPoint.x,
                        userPoint.y
                    );

                if (
                    d < nearest
                ) {

                    nearest = d;
                }

                if (
                    nearest <=
                    LETTER_TOLERANCE
                ) {

                    break;
                }
            }

            if (
                nearest <=
                LETTER_TOLERANCE
            ) {

                coveredTarget++;
            }
        }
    }

    if (
        totalTarget === 0
    ) {

        return 0;
    }

    return (
        coveredTarget /
        totalTarget
    );
}

/* =========================================================
   ÇİZGİ UZUNLUĞU KONTROLÜ
========================================================= */

function getUserLength() {

    let total = 0;

    for (
        const stroke
        of tutorialStrokes
    ) {

        for (
            let i = 1;
            i < stroke.length;
            i++
        ) {

            total +=
                distance(
                    stroke[i - 1].x,
                    stroke[i - 1].y,
                    stroke[i].x,
                    stroke[i].y
                );
        }
    }

    return total;
}

function getTargetLength() {

    let total = 0;

    if (!activeLetter) {
        return 0;
    }

    for (
        const stroke
        of activeLetter
    ) {

        for (
            let i = 1;
            i < stroke.length;
            i++
        ) {

            const a =
                toScreen(
                    stroke[i - 1]
                );

            const b =
                toScreen(
                    stroke[i]
                );

            total +=
                distance(
                    a.x,
                    a.y,
                    b.x,
                    b.y
                );
        }
    }

    return total;
}

/* =========================================================
   HARF DOĞRULAMA
========================================================= */

function checkLetter() {

    if (
        completionLocked ||
        !activeLetter
    ) {

        return;
    }

    const userLength =
        getUserLength();

    const targetLength =
        getTargetLength();

    /*
     * Çok küçük bir çizim
     * hiçbir zaman harf sayılmaz.
     */
    if (
        userLength <
        targetLength * 0.38
    ) {

        return;
    }

    const coverage =
        calculateCoverage();

    /*
     * Kullanıcının çizimi hedefin
     * yaklaşık 82%'sini kaplamalı.
     */
    if (
        coverage >= 0.82
    ) {

        completionLocked = true;

        completeLetter();
    }
}

/* =========================================================
   TUTORIAL HEDEFİNİ GÖSTER
========================================================= */

function showCurrentLetter() {

    while (
        tutorialIndex <
        TUTORIAL_TEXT.length &&
        TUTORIAL_TEXT[
            tutorialIndex
        ] === " "
    ) {

        tutorialIndex++;
    }

    if (
        tutorialIndex >=
        TUTORIAL_TEXT.length
    ) {

        finishTutorial();

        return;
    }

    const char =
        TUTORIAL_TEXT[
            tutorialIndex
        ];

    activeLetter =
        LETTERS[char];

    tutorialStrokes = [];

    currentStroke = [];

    completionLocked = false;

    targetLetter.textContent =
        char;

    if (tutorialProgress) {

        const current =
            TUTORIAL_TEXT
                .slice(
                    0,
                    tutorialIndex
                )
                .replaceAll(
                    " ",
                    ""
                )
                .length + 1;

        tutorialProgress.textContent =
            `${current} / ${
                TUTORIAL_TEXT
                    .replaceAll(
                        " ",
                        ""
                    )
                    .length
            }`;
    }

    targetLetter.classList.remove(
        "visible"
    );

    requestAnimationFrame(
        () => {

            targetLetter.classList.add(
                "visible"
            );
        }
    );
}

/* =========================================================
   HARF TAMAMLANDI
========================================================= */

async function completeLetter() {

    const box =
        getLetterBox();

    /*
     * Önce hedefi kaldır.
     */
    targetLetter.classList.remove(
        "visible"
    );

    /*
     * Tutorial çizgisini temizle.
     */
    tutorialStrokes = [];

    currentStroke = [];

    /*
     * Harfin ortasında
     * küçük patlama.
     */
    flowerBurst(
        box.cx,
        box.cy,
        22,
        95
    );

    playTick();

    await sleep(260);

    tutorialIndex++;

    showCurrentLetter();
}

/* =========================================================
   TUTORIAL BİTTİ
========================================================= */

async function finishTutorial() {

    if (tutorialFinished) {
        return;
    }

    tutorialFinished = true;

    activeLetter = null;

    tutorialStrokes = [];

    currentStroke = [];

    targetLetter.classList.remove(
        "visible"
    );

    /*
     * Son büyük patlama.
     */
    flowerBurst(
        window.innerWidth / 2,
        window.innerHeight / 2,
        65,
        240
    );

    playComplete();

    await sleep(550);

    if (tutorial) {

        tutorial.classList.add(
            "finished"
        );
    }

    await sleep(450);

    if (message) {

        message.classList.add(
            "show"
        );
    }

    if (clearButton) {

        clearButton.classList.add(
            "show"
        );
    }
}

/* =========================================================
   ÇİÇEK OLUŞTUR
========================================================= */

function addFlower(
    x,
    y,
    size = null,
    life = FLOWER_LIFE
) {

    if (
        flowers.length >=
        MAX_FLOWERS
    ) {

        flowers.splice(
            0,
            Math.floor(
                MAX_FLOWERS * .08
            )
        );
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

        created:
            performance.now(),

        life
    });
}

/* =========================================================
   ÇİÇEK PATLAMASI
========================================================= */

function flowerBurst(
    x,
    y,
    count = 22,
    radius = 95
) {

    addFlower(
        x,
        y,
        34,
        9000
    );

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const distanceValue =
            random(
                20,
                radius
            );

        addFlower(

            x +
            Math.cos(angle) *
            distanceValue,

            y +
            Math.sin(angle) *
            distanceValue,

            random(
                9,
                25
            ),

            6000
        );
    }
}

/* =========================================================
   ÇİÇEK ÇİZ
========================================================= */

function drawFlower(
    flower,
    now
) {

    const age =
        now -
        flower.created;

    if (
        age >=
        flower.life
    ) {

        return false;
    }

    let alpha =
        flower.alpha;

    if (
        age >
        flower.life -
        FLOWER_FADE
    ) {

        alpha *=
            1 -
            (
                age -
                (
                    flower.life -
                    FLOWER_FADE
                )
            ) /
            FLOWER_FADE;
    }

    const appear =
        clamp(
            age / 180,
            0,
            1
        );

    const scale =
        (
            1 -
            Math.pow(
                1 - appear,
                3
            )
        ) *
        (
            1 +
            Math.sin(
                now * .0015 +
                flower.phase
            ) * .025
        );

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
        alpha;

    ctx.shadowColor =
        "rgba(100,40,90,.18)";

    ctx.shadowBlur = 5;

    ctx.shadowOffsetY = 2;

    const petalCount = 5;

    for (
        let i = 0;
        i < petalCount;
        i++
    ) {

        ctx.save();

        ctx.rotate(
            i *
            Math.PI * 2 /
            petalCount
        );

        const gradient =
            ctx.createLinearGradient(
                0,
                -flower.size * .1,
                0,
                -flower.size
            );

        gradient.addColorStop(
            0,
            `hsl(${328 + flower.hue}, 66%, 78%)`
        );

        gradient.addColorStop(
            .5,
            `hsl(${326 + flower.hue}, 63%, 72%)`
        );

        gradient.addColorStop(
            1,
            `hsl(${332 + flower.hue}, 60%, 88%)`
        );

        ctx.fillStyle =
            gradient;

        ctx.beginPath();

        ctx.moveTo(
            0,
            -flower.size * .13
        );

        ctx.bezierCurveTo(
            -flower.size * .45,
            -flower.size * .43,
            -flower.size * .48,
            -flower.size * .88,
            0,
            -flower.size
        );

        ctx.bezierCurveTo(
            flower.size * .48,
            -flower.size * .88,
            flower.size * .45,
            -flower.size * .43,
            0,
            -flower.size * .13
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
            flower.size * .27
        );

    center.addColorStop(
        0,
        "#fff0bc"
    );

    center.addColorStop(
        .55,
        "#f3a36f"
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
        flower.size * .23,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    return true;
}

/* =========================================================
   RENDER
========================================================= */

function render(now) {

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

        if (
            !drawFlower(
                flowers[i],
                now
            )
        ) {

            flowers.splice(
                i,
                1
            );
        }
    }

    requestAnimationFrame(
        render
    );
}

requestAnimationFrame(
    render
);

/* =========================================================
   KULLANICI ÇİZGİSİNİ KAYDET
========================================================= */

function recordPoint(
    x,
    y
) {

    const previous =
        currentStroke[
            currentStroke.length - 1
        ];

    if (previous) {

        const d =
            distance(
                previous.x,
                previous.y,
                x,
                y
            );

        /*
         * Çok küçük titreşimleri
         * kaydetmiyoruz.
         */
        if (
            d < 2
        ) {

            return;
        }
    }

    currentStroke.push({
        x,
        y
    });

    /*
     * Harf çizimi sırasında da
     * küçük çiçekler üret.
     */
    if (
        tutorialFinished
    ) {

        return;
    }

    const point =
        currentStroke[
            currentStroke.length - 1
        ];

    if (
        currentStroke.length === 1
    ) {

        addFlower(
            point.x,
            point.y,
            7,
            1800
        );

        return;
    }

    const previousPoint =
        currentStroke[
            currentStroke.length - 2
        ];

    distanceAccumulator +=
        distance(
            previousPoint.x,
            previousPoint.y,
            point.x,
            point.y
        );

    while (
        distanceAccumulator >=
        FLOWER_DISTANCE
    ) {

        addFlower(
            point.x,
            point.y,
            7,
            1800
        );

        distanceAccumulator -=
            FLOWER_DISTANCE;
    }
}

/* =========================================================
   POINTER DOWN
========================================================= */

function pointerDown(event) {

    initAudio();

    if (
        activePointerId !== null
    ) {

        return;
    }

    activePointerId =
        event.pointerId;

    pointerDown = true;

    lastX =
        event.clientX;

    lastY =
        event.clientY;

    distanceAccumulator = 0;

    currentStroke = [];

    recordPoint(
        lastX,
        lastY
    );

    try {

        canvas.setPointerCapture(
            event.pointerId
        );

    } catch (error) {}
}

/* =========================================================
   POINTER MOVE
========================================================= */

function pointerMove(event) {

    if (
        !pointerDown ||
        event.pointerId !==
        activePointerId
    ) {

        return;
    }

    const x =
        event.clientX;

    const y =
        event.clientY;

    const dx =
        x - lastX;

    const dy =
        y - lastY;

    const len =
        Math.hypot(
            dx,
            dy
        );

    /*
     * Hızlı hareketlerde
     * aradaki noktaları doldur.
     */
    const steps =
        Math.max(
            1,
            Math.ceil(
                len / 4
            )
        );

    for (
        let i = 1;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;

        const px =
            lerp(
                lastX,
                x,
                t
            );

        const py =
            lerp(
                lastY,
                y,
                t
            );

        recordPoint(
            px,
            py
        );
    }

    lastX = x;
    lastY = y;

    /*
     * Harf çiziliyorsa
     * sürekli kontrol et.
     */
    if (
        !tutorialFinished
    ) {

        checkLetter();
    }
}

/* =========================================================
   POINTER UP
========================================================= */

function pointerUp(event) {

    if (
        event &&
        event.pointerId !==
        activePointerId
    ) {

        return;
    }

    pointerDown = false;

    if (
        currentStroke.length >= 2 &&
        !tutorialFinished
    ) {

        tutorialStrokes.push(
            currentStroke
        );

        /*
         * Stroke bittikten sonra
         * tekrar kontrol.
         */
        checkLetter();
    }

    currentStroke = [];

    activePointerId = null;

    try {

        if (event) {

            canvas.releasePointerCapture(
                event.pointerId
            );
        }

    } catch (error) {}
}

/* =========================================================
   POINTER EVENTLERİ
========================================================= */

canvas.addEventListener(
    "pointerdown",
    pointerDown,
    {
        passive: true
    }
);

canvas.addEventListener(
    "pointermove",
    pointerMove,
    {
        passive: true
    }
);

canvas.addEventListener(
    "pointerup",
    pointerUp,
    {
        passive: true
    }
);

canvas.addEventListener(
    "pointercancel",
    pointerUp,
    {
        passive: true
    }
);

/* =========================================================
   TEMİZLE
========================================================= */

if (clearButton) {

    clearButton.addEventListener(
        "click",
        () => {

            flowers = [];

            distanceAccumulator = 0;

            tutorialStrokes = [];

            currentStroke = [];

            ctx.clearRect(
                0,
                0,
                window.innerWidth,
                window.innerHeight
            );
        }
    );
}

/* =========================================================
   BAŞLANGIÇ
========================================================= */

function startTutorial() {

    tutorialFinished = false;

    tutorialIndex = 0;

    activeLetter = null;

    tutorialStrokes = [];

    currentStroke = [];

    flowers = [];

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    if (message) {

        message.classList.remove(
            "show"
        );
    }

    if (clearButton) {

        clearButton.classList.remove(
            "show"
        );
    }

    if (tutorial) {

        tutorial.classList.remove(
            "finished"
        );
    }

    showCurrentLetter();
}

startTutorial();
```
