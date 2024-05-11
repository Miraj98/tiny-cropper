let stage;
// const defaultNodeProps = {
//     x: 0, 
//     y: 0, 
//     width: 0, 
//     height: 0, 
//     draggable: true,
//     isDragging: false, 
//     dragOffset: null, 
// };
// class Node {
//     constructor(stage, props={}) {
//         const _props = { ...defaultNodeProps, ...props };
//         this.stage = stage;
//         this.props = _props;
//     }

//     getDragBounds() {
//         const xMin = 0, xMax = this.stage.width - this.props.width;
//         const yMin = 0, yMax = this.stage.height - this.props.height;
//         return [xMin, yMin, xMax, yMax];
//     }

//     onDragStart(e) {
//         if (!this.props.draggable) return ;
//         const pos = getMousePosition(e, this.stage);
//         this.props.dragOffset = {
//             x: pos.x - this.props.x,
//             y: pos.y - this.props.y,
//         };
//     }

//     onDrag(e) {
//         const pos = getMousePosition(e, this.stage);
//         const [xMin, yMin, xMax, yMax] = this.getDragBounds();
//         this.props.x = clamp(pos.x - this.props.dragOffset.x, xMin, xMax);
//         this.props.y = clamp(pos.y - this.props.dragOffset.y, yMin, yMax);
//         e.target.style.cursor = 'move';
//     }

//     onDragEnd(e) {
//         this.props.isDragging = false;
//     }
// }
// class Cropper extends Node {
//     constructor(props) {
//         super(props);
//     }
// }
const state = {
    crop: { 
        x: 0, 
        y: 0, 
        width: 0, 
        height: 0, 
        draggable: true,
        isDragging: false, 
        drag: { offset: null } 
    },
    image: {
        src: null,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        draggable: false,
    },
    isDragging: false,
};

function getMousePosition(e, stage) {
    var bounds = stage.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    return { x, y };
}

function isInBbox(box, point) {
    return (point.x >= box.x && point.x <= box.x + box.width) && (point.y >= box.y && point.y <= box.y + box.height);
}

function clamp(val, min, max) {
    if (val > max) return max;
    else if (val < min) return min;
    return val;
}

function setupCanvas({ width=800, height=600, parent=null }) {
    stage = document.createElement('canvas');
    stage.id = 'stage';
    stage.width = width;
    stage.height = height;
    const target = parent || document.body;
    target.appendChild(stage);
    const ctx = stage.getContext('2d');

    stage.addEventListener('mousedown', (e) => {
        const { x, y } = getMousePosition(e, stage);
        const isRectDragged = isInBbox(state.crop, {x, y});
        if (isRectDragged) {
            state.crop.isDragging = true;
            state.crop.drag.offset = { x: x - state.crop.x, y: y - state.crop.y };
        } else if (state.crop.width === 0 && state.crop.height === 0) {
            state.crop.x = x;
            state.crop.y = y;
            state.isDragging = true;
        }
    });

    stage.addEventListener('mousemove', (e) => {
        let currentPos = getMousePosition(e, stage);
        if (state.isDragging) {
            const width = currentPos.x - state.crop.x;
            const height = currentPos.y - state.crop.y;
            state.crop.width = width;
            state.crop.height = height;
        } else if (state.crop.isDragging) {
            const xMin = 0, xMax = ctx.canvas.width - state.crop.width;
            const yMin = 0, yMax = ctx.canvas.height - state.crop.height;
            state.crop.x = clamp(currentPos.x - state.crop.drag.offset.x, xMin, xMax);
            state.crop.y = clamp(currentPos.y - state.crop.drag.offset.y, yMin, yMax);
            e.target.style.cursor = 'move';
        }
    });

    stage.addEventListener('mouseup', (e) => {
        if (state.isDragging) {
            state.isDragging = false;
        } else if (state.crop.isDragging) {
            state.crop.isDragging = false;
        }
        e.target.style.cursor = 'default';
    });
    redraw(ctx);
    // setInterval(() => redraw(ctx), 30);
}

function redraw(ctx) {
    function drawBG() {
        ctx.beginPath();
        ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#fafafa';
        ctx.fill();
    }
    function drawCrop() {
        if (!state.crop) return ;
        const { x, y, width, height } = state.crop;
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.strokeStyle = 'rgb(30, 30, 30)';
        ctx.stroke();
    }
    function drawClipArea() {
        if (!state.crop) return ;
        const { x, y, width, height } = state.crop;
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        // const borderWidth = 2;
        // ctx.fillStyle = 'green';
        // ctx.fill();
        ctx.closePath();
    }
    function drawImage(img, options = { opacity: 1 }) {
        const stageAspectRatio = ctx.canvas.width / ctx.canvas.height;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let width, height;
        if (aspectRatio >= stageAspectRatio) {
            width = ctx.canvas.width;
            height = width / aspectRatio;
        } else {
            height = ctx.canvas.height;
            width = aspectRatio * height;
        }
        // if (aspectRatio > 1) {
        //     if (aspectRatio >= stageAspectRatio) {
        //         width = ctx.canvas.width;
        //         height = width / aspectRatio;
        //     } else {
        //         height = ctx.canvas.height;
        //         width = aspectRatio * height;
        //     }
        // } else {

        // }
        ctx.globalAlpha = options.opacity;
        ctx.drawImage(img, 0, 0, width, height);
        if (options.opacity < 1) {
            ctx.globalAlpha = 1;
        }
    }
    window.requestAnimationFrame(() => redraw(ctx));
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawBG();
    if (state.image.src) {
        const isClipped = state.crop.width > 0 && state.crop.height > 0;
        if (isClipped) {
            drawImage(state.image.src, { opacity: 0.2 });
            ctx.save();
            drawClipArea();
            ctx.clip();
            drawImage(state.image.src);
            ctx.restore();
        } else {
            drawImage(state.image.src);
        }
    }
    drawCrop();
}

function addImageToCanvas(img) {
    if (!stage || !img) return ;
    state.image.src = img;
}

setupCanvas({});

