        const transformed = floor.points.map((p) => {
            return p
                .copy()
                .sub(CAMERA.pos)
                .rotate(0, CAMERA.yawSin, CAMERA.yawCos);
        });
            wall.seg.p1
                .copy()
                .sub(CAMERA.pos)
                .rotate(0, CAMERA.yawSin, CAMERA.yawCos),
            wall.seg.p2
                .copy()
                .sub(CAMERA.pos)
                .rotate(0, CAMERA.yawSin, CAMERA.yawCos)
