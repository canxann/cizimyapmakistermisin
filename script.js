* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html,
body {
    width: 100%;
    height: 100%;
}

body {
    overflow: hidden;

    background: #aec8f4;

    /*
       Çok önemli:
       Telefonda parmakla çizim yaparken
       sayfanın kaymasını engeller.
    */
    touch-action: none;

    user-select: none;
    -webkit-user-select: none;

    -webkit-touch-callout: none;
}


/* ==================================================
   ANA ALAN
================================================== */

#app {
    position: relative;

    width: 100vw;
    height: 100vh;

    overflow: hidden;

    background:
        radial-gradient(
            circle at 50% 50%,
            rgba(255, 255, 255, 0.13),
            transparent 45%
        ),
        #aec8f4;
}


/* ==================================================
   ORTADAKİ YAZI
================================================== */

#message {
    position: absolute;

    left: 50%;
    top: 50%;

    transform: translate(-50%, -50%);

    z-index: 5;

    width: max-content;
    max-width: 90vw;

    color: #e4496c;

    font-family:
        Georgia,
        "Times New Roman",
        serif;

    font-size: clamp(
        28px,
        4.5vw,
        64px
    );

    font-weight: 500;

    line-height: 1.15;

    text-align: center;

    pointer-events: none;

    transition:
        opacity 0.5s ease,
        transform 0.5s ease;
}


/*
   Çizim başlayınca yazı hafifçe
   geri plana çekilir.
*/

#message.drawing {
    opacity: 0.18;

    transform:
        translate(-50%, -50%)
        scale(0.96);
}


/* ==================================================
   ÇİZİM KATMANI
================================================== */

#drawingLayer {
    position: absolute;

    inset: 0;

    z-index: 10;

    pointer-events: none;
}


/* ==================================================
   TEMEL ÇİÇEK
================================================== */

.flower {
    position: absolute;

    width: var(--flower-size, 30px);
    height: var(--flower-size, 30px);

    pointer-events: none;

    transform:
        translate(-50%, -50%)
        rotate(var(--rotation, 0deg));

    filter:
        drop-shadow(
            0 4px 5px rgba(95, 35, 75, 0.22)
        );

    will-change: transform;
}


/* ==================================================
   YAPRAKLAR
================================================== */

.petal {
    position: absolute;

    left: 50%;
    top: 50%;

    width: 42%;
    height: 68%;

    transform-origin: 50% 100%;

    border-radius:
        55%
        55%
        45%
        45%;

    background:
        linear-gradient(
            145deg,
            #fff0f8 0%,
            #f4b1d0 38%,
            #dc6798 100%
        );

    box-shadow:
        inset
        -2px -3px 5px
        rgba(126, 48, 91, 0.12);
}


/*
   Her yaprağın açısı
*/

.p1 {
    transform:
        translate(-50%, -100%)
        rotate(0deg);
}

.p2 {
    transform:
        translate(-50%, -100%)
        rotate(72deg);
}

.p3 {
    transform:
        translate(-50%, -100%)
        rotate(144deg);
}

.p4 {
    transform:
        translate(-50%, -100%)
        rotate(216deg);
}

.p5 {
    transform:
        translate(-50%, -100%)
        rotate(288deg);
}


/* ==================================================
   ÇİÇEK MERKEZİ
================================================== */

.center {
    position: absolute;

    left: 50%;
    top: 50%;

    width: 25%;
    height: 25%;

    transform: translate(-50%, -50%);

    border-radius: 50%;

    background:
        radial-gradient(
            circle,
            #ffe6a7 0%,
            #f4ae72 42%,
            #d96587 100%
        );

    box-shadow:
        0 1px 3px rgba(95, 35, 65, 0.28);
}


/* ==================================================
   ÇİZİM ÇİÇEKLERİ
================================================== */

.drawing-flower {
    animation:
        flowerAppear 0.45s ease-out both,
        flowerFloat
        3.2s
        ease-in-out
        infinite;

    animation-delay:
        0s,
        var(--float-delay, 0s);
}


/*
   Çiçek çizgiye eklendiğinde
   hafifçe büyüyerek gelsin.
*/

@keyframes flowerAppear {

    0% {
        opacity: 0;

        transform:
            translate(-50%, -50%)
            scale(0.15)
            rotate(0deg);
    }

    70% {
        opacity: 1;

        transform:
            translate(-50%, -50%)
            scale(1.08)
            rotate(var(--rotation, 0deg));
    }

    100% {
        opacity: 1;

        transform:
            translate(-50%, -50%)
            scale(1)
            rotate(var(--rotation, 0deg));
    }
}


/*
   Çok hafif canlılık.
   Çiçek çizginin yerini değiştirmez.
*/

@keyframes flowerFloat {

    0%,
    100% {
        margin-top: 0;
    }

    50% {
        margin-top: -2px;
    }
}


/* ==================================================
   FIRÇA ÇİÇEĞİ
================================================== */

.brush-flower {
    position: fixed;

    left: 0;
    top: 0;

    z-index: 100;

    opacity: 0;

    transform:
        translate(-50%, -50%)
        scale(0.85);

    transition:
        opacity 0.15s ease;

    pointer-events: none;
}


/*
   Aktifken görünür
*/

.brush-flower.active {
    opacity: 1;
}


/* ==================================================
   MOBİL
================================================== */

@media (max-width: 600px) {

    #message {
        max-width: 88vw;

        font-size: 31px;

        white-space: normal;
    }

    .drawing-flower {
        filter:
            drop-shadow(
                0 3px 4px
                rgba(95, 35, 75, 0.20)
            );
    }
}


/* ==================================================
   KÜÇÜK TELEFONLAR
================================================== */

@media (max-width: 380px) {

    #message {
        font-size: 27px;
    }
}
