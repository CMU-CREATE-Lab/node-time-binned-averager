const EventEmitter = require('events');
const TypeUtils = require('data-type-utils');

// Clones the given object. I'm aware this isn't perfect for any possible object. But, for here, it's totally fine.
// See https://stackoverflow.com/a/728694/703200
const cloneObject = function(obj) {
   return JSON.parse(JSON.stringify(obj));
};

// Props to https://stackoverflow.com/a/10624256/703200
const computeAverage = function(arr) {
   const sum = arr.reduce((a, b) => a + b, 0);
   return (sum / arr.length) || 0;
};

class TimeBinnedAverager extends EventEmitter {
   constructor(binSizeSeconds, channelNames) {
      super();
      if (!TypeUtils.isPositiveInt(binSizeSeconds)) {
         throw new TypeError("binSizeSeconds must be a positive integer");
      }

      // make sure channelNames is a non-empty array
      if (!Array.isArray(channelNames) || channelNames.length < 1) {
         throw new TypeError("channelNames must be a non-empty array");
      }

      this._binSizeSeconds = parseInt(binSizeSeconds);
      this._binBounds = null;
      this._timestamps = [];
      this._channelValues = {};

      // make sure channel names are strings
      const self = this;
      channelNames.forEach(function(channelName) {
         if (!TypeUtils.isNonEmptyString(channelName)) {
            throw new TypeError("Channel [" + channelName + "] is not a string.  All channel names must be strings.");
         }

         self._channelValues[channelName] = [];
      });

      this._channelNames = new Set(channelNames);
      this._emptyChannelValues = cloneObject(this._channelValues);
   }

   _getBinBoundsForTime(unixTimeSeconds) {
      const binStart = unixTimeSeconds - (unixTimeSeconds % this._binSizeSeconds);
      const binEnd = binStart + this._binSizeSeconds;
      return { start : binStart, end : binEnd };
   }

   _isInBin(unixTimeSeconds) {
      return (this._binBounds.start <= unixTimeSeconds && unixTimeSeconds < this._binBounds.end);
   }

   appendSample(unixTimeSeconds, channelValues) {
      const self = this;
      let avgSample = null;

      if (!TypeUtils.isNumeric(unixTimeSeconds)) {
         throw new TypeError("unixTimeSeconds must be numeric")
      }

      // make sure the timestamp is strictly increasing
      if (self._timestamps.length > 0) {
         if (unixTimeSeconds <= self._timestamps[self._timestamps.length - 1]) {
            throw new Error("Timestamps must be added in strictly increasing order")
         }
      }

      // make sure the channelValues object contains all the expected channels and the channel values are all numeric
      this._channelNames.forEach(function(channelName) {
         if (channelName in channelValues) {
            if (!TypeUtils.isNumeric(channelValues[channelName])) {
               throw new TypeError("Value for channel '" + channelName + "' must be numeric")
            }
         }
         else {
            throw new Error("Invalid channelValues, missing expected channel: " + channelName);
         }
      });

      // If we don't have a current time bin yet, then just compute beginning and ending times for the time bin
      if (self._binBounds === null) {
         self._binBounds = self._getBinBoundsForTime(unixTimeSeconds);
      }
      else {
         // Otherwise, if this new sample is NOT in the current bin, then it's time to compute the average for the
         // timestamps and channel values in the current bin, emit an event, and create a new bin
         if (!self._isInBin(unixTimeSeconds)) {
            avgSample = this.computeAverageSample();

            // create new bounds and reset
            self._binBounds = self._getBinBoundsForTime(unixTimeSeconds);
            self._timestamps = [];
            self._channelValues = cloneObject(this._emptyChannelValues);

            self.emit("averageSample", avgSample);
         }
      }

      // now simply add the channelValues to the bin
      self._timestamps.push(parseFloat(unixTimeSeconds));
      self._channelNames.forEach(function(channelName) {
         self._channelValues[channelName].push(parseFloat(channelValues[channelName]));
      });

      return avgSample;
   }

   // Returns the averaged timestamp and sample of the current time bin, or null if no samples have been added yet.
   computeAverageSample() {
      const self = this;

      if (self._binBounds !== null) {
         const avgTimestamp = computeAverage(self._timestamps);
         const avgValues = {};

         self._channelNames.forEach(function(channel) {
            avgValues[channel] = computeAverage(self._channelValues[channel]);
         });

         return {
            timestamp : avgTimestamp,
            values : avgValues
         };
      }

      return null;
   }
}

module.exports = TimeBinnedAverager;
