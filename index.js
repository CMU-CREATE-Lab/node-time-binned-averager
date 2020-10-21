const EventEmitter = require('events');
const TypeUtils = require('data-type-utils');

// Clones the given object. I'm aware this isn't perfect for any possible object. But, for here, it's totally fine.
// See https://stackoverflow.com/a/728694/703200
const cloneObject = function(obj) {
   return JSON.parse(JSON.stringify(obj));
};

// Computes the average of the given array.  Returns null if the array is empty.
// Props to https://stackoverflow.com/a/10624256/703200
const computeAverage = function(arr) {
   if (!Array.isArray(arr) || arr.length <= 0) {
      return null;
   }

   const sum = arr.reduce((a, b) => a + b, 0);
   return (sum / arr.length);
};

class TimeBinnedAverager extends EventEmitter {
   constructor(binSizeSeconds, numChannels) {
      super();
      if (!TypeUtils.isPositiveInt(binSizeSeconds)) {
         throw new TypeError("binSizeSeconds must be a positive integer");
      }

      if (!TypeUtils.isPositiveInt(numChannels)) {
         throw new TypeError("numChannels must be a positive integer");
      }

      this._binSizeSeconds = parseInt(binSizeSeconds);
      this._numChannels = parseInt(numChannels);
      this._binBounds = null;
      this._timestamps = [];
      this._channelValues = [];

      // initialize this._channelValues with empty arrays
      for (let i = 0; i < this._numChannels; i++) {
         this._channelValues.push([]);
      }

      // save a copy of the initialized this._channelValues for quick and easy reset when creating a new bin
      this._emptyChannelValues = cloneObject(this._channelValues);

      // Add one for the timestamp, which is assumed to be the first value of the record
      this._expectedRecordLength = 1 + this._numChannels;
   }

   _getBinBoundsForTime(unixTimeSeconds) {
      const binStart = unixTimeSeconds - (unixTimeSeconds % this._binSizeSeconds);
      const binEnd = binStart + this._binSizeSeconds;
      return { start : binStart, end : binEnd };
   }

   _isInBin(unixTimeSeconds) {
      return (this._binBounds.start <= unixTimeSeconds && unixTimeSeconds < this._binBounds.end);
   }

   appendSample(record) {
      const self = this;
      let avgSample = null;

      if (!Array.isArray(record) || record.length !== self._expectedRecordLength) {
         throw new TypeError("Record must be an array of length " + self._expectedRecordLength);
      }

      // timestamp must be the first element
      const unixTimeSeconds = record[0];

      if (!TypeUtils.isNumeric(unixTimeSeconds)) {
         throw new TypeError("The first element of the record (timestamp in UNIX time seconds) must be numeric");
      }

      // make sure the timestamp is strictly increasing
      if (self._timestamps.length > 0) {
         if (unixTimeSeconds <= self._timestamps[self._timestamps.length - 1]) {
            throw new Error("Records must be added with timestamps in strictly increasing order")
         }
      }

      // If we don't have a current time bin yet, then just compute beginning and ending times for the time bin
      if (self._binBounds === null) {
         self._binBounds = self._getBinBoundsForTime(unixTimeSeconds);
      }
      else {
         // Otherwise, if this new sample is NOT in the current bin, then it's time to compute the average for the
         // timestamps and channel values in the current bin, emit an event, and create a new bin
         if (!self._isInBin(unixTimeSeconds)) {
            avgSample = self.computeAverageSample();

            // create new bounds and reset
            self._binBounds = self._getBinBoundsForTime(unixTimeSeconds);
            self._timestamps = [];
            self._channelValues = cloneObject(self._emptyChannelValues);

            self.emit("averageSample", avgSample);
         }
      }

      // record this timestamp for the bin
      self._timestamps.push(parseFloat(unixTimeSeconds));

      // add channel values to their appropriate array for this bin, skipping any values which are not numeric
      for (let i = 0; i < self._channelValues.length; i++) {
         const newValue = record[i + 1];    // add one to the index to account for the timestamp
         if (TypeUtils.isNumeric(newValue)) {
            self._channelValues[i].push(parseFloat(newValue));
         }
      }

      return avgSample;
   }

   // Returns the averaged timestamp and sample of the current time bin, or null if no samples have been added yet.
   computeAverageSample() {
      const self = this;

      if (self._binBounds !== null) {
         const averageSample = [computeAverage(self._timestamps)];

         // compute the average of all the values within each channel
         for (let i = 0; i < self._channelValues.length; i++) {
            averageSample[i + 1] = computeAverage(self._channelValues[i]);
         }

         return averageSample;
      }

      return null;
   }
}

module.exports = TimeBinnedAverager;
