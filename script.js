const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d", {
        alpha: true
    });

const tutorialUI =
    document.getElementById("tutorialUI");

const letterElement =
    document.getElementById("letter");

const progressElement =
    document.getElementById("progress");

const completeMessage =
    document.getElementById("completeMessage");

const clearButton =
    document.getElementById("clearButton");


/* =========================================
   AYARLAR
========================================= */

const TEXT =
    "VALORANT GIRL PICK ME OLMA";

const FLOWER_DISTANCE = 15;

const MAX_FLOWERS = 850;

const FLOWER_LIFETIME = 7200;

const FLOWER_FADE = 1300;


/*
 * Harf algılama toleransı.
 *
 * Daha büyük:
 * Daha kolay.
 *
 * Daha küçük:
 * Daha hassas.
 */
const LETTER_TOLERANCE = 48;


/*
 * Hedefin en az ne kadarı
 * çizilmiş olmalı.
 */
const REQUIRED_COVERAGE = .76;


/*
 * Çizimin hedefe ne kadar
 * yakın olması gerekiyor.
 */
const REQUIRED_ACCURACY = .55;


/*
 * Kullanıcının çizimi,
 * hedefin en az bu kadar
 * uzunluğunda olmalı.
 */
const MIN_DRAW_RATIO = .48;


/* =========================================
   DURUM
========================================= */

let tutorial = true;

let letterIndex = 0;

let activeLetter = null;

let drawing = false;

let pointerId = null;

let currentStroke = [];

let tutorialStrokes = [];

let lastX = 0;

let lastY = 0;

let flowerDistance = 0;

let flowers = [];

let dpr = 1;

let audioContext = null;


/* =========================================
   CANVAS BOYUTU
========================================= */

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


function dist(
    a,
    b
) {

    return Math.hypot(
        b.x - a.x,
        b.y - a.y
    );
}


function random(
    min,
    max
) {

    return Math.random() *
        (max - min) +
        min;
}


/* =========================================
   HARF GEOMETRİLERİ
========================================= */

/*
 * Koordinatlar -1 / +1 arasındadır.
 *
 * Bunlar ekrandaki fonttan bağımsız
 * gerçek çizim yollarıdır.
 */

const LETTERS = {

    V: [
        [
            [-.58, -.62],
            [0, .62],
            [.58, -.62]
        ]
    ],

    A: [
        [
            [-.56, .62],
            [0, -.64],
            [.56, .62]
        ],
        [
            [-.31, .02],
            [.31, .02]
        ]
    ],

    L: [
        [
            [-.45, -.64],
            [-.45, .64],
            [.56, .64]
        ]
    ],

    O: [
        [
            [0, -.66],
            [.40, -.56],
            [.58, 0],
            [.40, .56],
            [0, .66],
            [-.40, .56],
            [-.58, 0],
            [-.40, -.56],
            [0, -.66]
        ]
    ],

    R: [
        [
            [-.46, .64],
            [-.46, -.64],
            [.16, -.64],
            [.50, -.44],
            [.16, -.02],
            [-.46, -.02]
        ],
        [
            [.14, -.02],
            [.55, .64]
        ]
    ],

    N: [
        [
            [-.50, .64],
            [-.50, -.64],
            [.50, .64],
            [.50, -.64]
        ]
    ],

    T: [
        [
            [-.60, -.64],
            [.60, -.64]
        ],
        [
            [0, -.64],
            [0, .64]
        ]
    ],

    G: [
        [
            [.52, -.43],
            [.27, -.64],
            [-.25, -.64],
            [-.55, -.35],
            [-.55, .35],
            [-.25, .64],
            [.28, .64],
            [.52, .40],
            [.52, .06],
            [.06, .06]
        ]
    ],

    I: [
        [
            [-.34, -.64],
            [.34, -.64]
        ],
        [
            [0, -.64],
            [0, .64]
        ],
        [
            [-.34, .64],
            [.34, .64]
        ]
    ],

    P: [
        [
            [-.46, .64],
            [-.46, -.64],
            [.17, -.64],
            [.48, -.44],
            [.17, -.04],
            [-.46, -.04]
        ]
    ],

    C: [
        [
            [.52, -.48],
            [.20, -.64],
            [-.28, -.64],
            [-.55, -.34],
            [-.55, .34],
            [-.28, .64],
            [.20, .64],
            [.52, .48]
        ]
    ],

    K: [
        [
            [-.46, -.64],
            [-.46, .64]
        ],
        [
            [.50, -.64],
            [-.46, 0],
            [.54, .64]
        ]
    ],

    E: [
        [
            [.50, -.64],
            [-.50, -.64],
            [-.50, .64],
            [.50, .64]
        ],
        [
            [-.50, 0],
            [.28, 0]
        ]
    ],

    M: [
        [
            [-.58, .64],
            [-.58, -.64],
            [0, .08],
            [.58, -.64],
            [.58, .64]
        ]
    ]
};


/* =========================================
   HARF TRANSFORM
========================================= */

function getLetterTransform() {

    const width =
        Math.min(
            window.innerWidth * .52,
            330
        );

    const height =
        Math.min(
            window.innerHeight * .38,
            270
        );


    return {
        x:
            window.innerWidth / 2,

        y:
            window.innerHeight / 2,

        width,

        height
    };
}


function toScreen(point) {

    const t =
        getLetterTransform();


    return {
        x:
            t.x +
            point[0] *
            t.width,

        y:
            t.y +
            point[1] *
            t.height
    };
}


/* =========================================
   TARGET SAMPLE
========================================= */

function sampleTarget() {

    if (!activeLetter) {
        return [];
    }


    const points = [];


    for (
        const stroke
        of activeLetter
    ) {

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


            const length =
                Math.hypot(
                    b.x - a.x,
                    b.y - a.y
                );


            const steps =
                Math.max(
                    4,
                    Math.ceil(
                        length / 8
                    )
                );


            for (
                let j = 0;
                j < steps;
                j++
            ) {

                const p =
                    j / steps;


                points.push({
                    x:
                        lerp(
                            a.x,
                            b.x,
                            p
                        ),

                    y:
                        lerp(
                            a.y,
                            b.y,
                            p
                        )
                });
            }
        }
    }


    return points;
}


/* =========================================
   HEDEF UZUNLUĞU
========================================= */

function getTargetLength() {

    if (!activeLetter) {
        return 0;
    }


    let total = 0;


    for (
        const stroke
        of activeLetter
    ) {

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


            total +=
                Math.hypot(
                    b.x - a.x,
                    b.y - a.y
                );
        }
    }


    return total;
}


/* =========================================
   USER ÇİZİM UZUNLUĞU
========================================= */

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
                dist(
                    stroke[i - 1],
                    stroke[i]
                );
        }
    }


    return total;
}


/* =========================================
   EN YAKIN MESAFE
========================================= */

function pointSegmentDistance(
    p,
    a,
    b
) {

    const abx =
        b.x - a.x;

    const aby =
        b.y - a.y;


    const length =
        abx * abx +
        aby * aby;


    if (
        length === 0
    ) {

        return Math.hypot(
            p.x - a.x,
            p.y - a.y
        );
    }


    let t =
        (
            (p.x - a.x) * abx +
            (p.y - a.y) * aby
        ) /
        length;


    t =
        clamp(
            t,
            0,
            1
        );


    const x =
        a.x +
        abx * t;


    const y =
        a.y +
        aby * t;


    return Math.hypot(
        p.x - x,
        p.y - y
    );
}


function pointToUserDistance(
    targetPoint
) {

    let minimum =
        Infinity;


    for (
        const stroke
        of tutorialStrokes
    ) {

        for (
            let i = 1;
            i < stroke.length;
            i++
        ) {

            const d =
                pointSegmentDistance(
                    targetPoint,
                    stroke[i - 1],
                    stroke[i]
                );


            if (
                d < minimum
            ) {

                minimum = d;
            }
        }
    }


    return minimum;
}


/* =========================================
   HARFİ DEĞERLENDİR
========================================= */

function evaluateLetter() {

    const target =
        sampleTarget();


    if (
        target.length === 0
    ) {

        return false;
    }


    const userLength =
        getUserLength();

    const targetLength =
        getTargetLength();


    /*
     * Çok kısa çizimi direkt reddet.
     */
    if (
        userLength <
        targetLength *
        MIN_DRAW_RATIO
    ) {

        return false;
    }


    /*
     * Hedef noktalarının kaç tanesine
     * kullanıcı yeterince yaklaşmış?
     */
    let covered = 0;


    let totalDistance = 0;


    for (
        const point
        of target
    ) {

        const d =
            pointToUserDistance(
                point
            );


        totalDistance +=
            Math.min(
                d,
                LETTER_TOLERANCE * 2
            );


        if (
            d <=
            LETTER_TOLERANCE
        ) {

            covered++;
        }
    }


    const coverage =
        covered /
        target.length;


    const averageDistance =
        totalDistance /
        target.length;


    /*
     * Accuracy 0 - 1.
     */
    const accuracy =
        clamp(
            1 -
            averageDistance /
            (LETTER_TOLERANCE *
