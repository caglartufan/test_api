function bytesToMb(bytes) {
    return bytes/Math.pow(2, 20);
}

function mbToBytes(mb) {
    return mb*Math.pow(2, 20);
}

exports.bytesToMb = bytesToMb;
exports.mbToBytes = mbToBytes;