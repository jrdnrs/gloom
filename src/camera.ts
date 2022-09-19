    yawSin: number;
    yawCos: number;

        // caching these
        this.yawCos = Math.cos(toRadians(this.yaw));
        this.yawSin = Math.sin(toRadians(this.yaw));
