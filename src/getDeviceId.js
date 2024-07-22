// getDeviceId.js
const { NoVideoInputDevicesError } = require("./errors");

function defaultDeviceIdChooser(filteredDevices, videoDevices, facingMode) {
  // Prioritize rear-facing camera if available
  const rearFacingDevices = filteredDevices.filter((device) =>
    /rear|back|environment/i.test(device.label)
  );

  if (rearFacingDevices.length > 0) {
    return rearFacingDevices[0].deviceId;
  }

  // If no rear-facing camera, fallback to front-facing or default logic
  const frontFacingDevices = filteredDevices.filter((device) =>
    /front|user|face/i.test(device.label)
  );

  if (frontFacingDevices.length > 0) {
    return frontFacingDevices[0].deviceId;
  }

  // Fallback to default logic
  if (filteredDevices.length > 0) {
    return filteredDevices[0].deviceId;
  }

  if (videoDevices.length == 1 || facingMode == "user") {
    return videoDevices[0].deviceId;
  }

  return videoDevices[1].deviceId;
}

const getFacingModePattern = (facingMode) =>
  facingMode == "environment" ? /rear|back|environment/i : /front|user|face/i;

function getDeviceId(
  facingMode,
  chooseDeviceId = defaultDeviceIdChooser,
  cameraId = "camera2 0"
) {
  // Get manual deviceId from available devices.
  return new Promise((resolve, reject) => {
    let enumerateDevices;
    try {
      enumerateDevices = navigator.mediaDevices.enumerateDevices();
    } catch (err) {
      reject(new NoVideoInputDevicesError());
    }
    enumerateDevices.then((devices) => {
      // Log connected cameras
      console.log("📷 Connected video devices:", devices);

      // Filter out non-videoinputs
      const videoDevices = devices.filter(
        (device) => device.kind == "videoinput"
      );

      console.log("📷 Available video devices:", videoDevices);

      if (videoDevices.length < 1) {
        reject(new NoVideoInputDevicesError());
        return;
      }

      const pattern = getFacingModePattern(facingMode);

      // Filter out video devices without the pattern
      const filteredDevices = videoDevices.filter(({ label }) => {
        return pattern.test(label) && label.includes(cameraId);
      });

      console.log("📷 Filtered video devices:", filteredDevices);
      console.log("📷 facingMode:", facingMode);

      resolve(chooseDeviceId(filteredDevices, videoDevices, facingMode));
    });
  });
}

module.exports = { getDeviceId, getFacingModePattern };
