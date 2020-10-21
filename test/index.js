// noinspection JSUnusedLocalSymbols
const should = require('should');
const expect = require('chai').expect;

const TimeBinnedAverager = require('../index');

describe('constructor', function() {
   it('should throw a TypeError if binSizeSeconds is undefined', function() {
      expect(function() {new TimeBinnedAverager();}).to.throw(TypeError);
      let x;
      expect(function() {new TimeBinnedAverager(x, 1);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is null', function() {
      expect(function() {new TimeBinnedAverager(null);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(null, 1);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is negative', function() {
      expect(function() {new TimeBinnedAverager(-1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(-42.42);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(-1, 1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(-42.42, 1);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is zero', function() {
      expect(function() {new TimeBinnedAverager(0);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(0, 1);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is numeric and positive, but not an integer', function() {
      expect(function() {new TimeBinnedAverager(0.04);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(42.42);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(0.04, 1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(42.42, 1);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is not an integer', function() {
      expect(function() {new TimeBinnedAverager(['hi'], 1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager({}, 1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager({ foo : 'bar' }, 1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager("hello world", 1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(new Set(), 1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(new Date(), 1);}).to.throw(TypeError);
   });

   it('should throw a TypeError if numChannels is undefined', function() {
      expect(function() {new TimeBinnedAverager(30);}).to.throw(TypeError);
      let x;
      expect(function() {new TimeBinnedAverager(30, x);}).to.throw(TypeError);
   });
   it('should throw a TypeError if numChannels is null', function() {
      expect(function() {new TimeBinnedAverager(30, null);}).to.throw(TypeError);
   });
   it('should throw a TypeError if numChannels is negative', function() {
      expect(function() {new TimeBinnedAverager(30, -1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, -42.42);}).to.throw(TypeError);
   });
   it('should throw a TypeError if numChannels is zero', function() {
      expect(function() {new TimeBinnedAverager(30, 0);}).to.throw(TypeError);
   });
   it('should throw a TypeError if numChannels is numeric and positive, but not an integer', function() {
      expect(function() {new TimeBinnedAverager(30, 0.04);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, 42.42);}).to.throw(TypeError);
   });
   it('should throw a TypeError if numChannels is not an integer', function() {
      expect(function() {new TimeBinnedAverager(15, ['hi']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(15, {});}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(15, { foo : 'bar' });}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(15, "hello world");}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(15, new Set());}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(15, new Date());}).to.throw(TypeError);
   });

   it('should succeed if binSizeSeconds and numChannels are both positive integers', function() {
      expect(function() {new TimeBinnedAverager(30, 1);}).to.not.throw(TypeError);
      expect(function() {new TimeBinnedAverager("30", 37);}).to.not.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, "42");}).to.not.throw(TypeError);
   });
});

describe('appendSample()', function() {
   it('should throw a TypeError if unixTimeSeconds is not numeric', function() {
      const averager = new TimeBinnedAverager(30, 1);
      let x;
      expect(function() {averager.appendSample([null, 15])}).to.throw(TypeError);
      expect(function() {averager.appendSample([, 15])}).to.throw(TypeError);
      expect(function() {averager.appendSample([x, 15])}).to.throw(TypeError);
      expect(function() {averager.appendSample(["", 15])}).to.throw(TypeError);
      expect(function() {averager.appendSample(["hello!", 15])}).to.throw(TypeError);
      expect(function() {averager.appendSample([{}, 15])}).to.throw(TypeError);
      expect(function() {averager.appendSample([[], 15])}).to.throw(TypeError);
      expect(function() {averager.appendSample([new Date(), 15])}).to.throw(TypeError);
      expect(function() {averager.appendSample([new Set(), 15])}).to.throw(TypeError);
   });

   it('should throw an Error if samples are not added with strictly increasing timestamps', function() {
      const averager = new TimeBinnedAverager(30, 1);
      expect(averager.appendSample([0, 10])).to.be.null;
      expect(averager.appendSample([1, 15])).to.be.null;
      expect(function() {averager.appendSample([1, 15])}).to.throw(Error);
      expect(averager.appendSample([2, 15])).to.be.null;
      expect(function() {averager.appendSample([1.5, 15])}).to.throw(Error);
      expect(function() {averager.appendSample([1.9999, 15])}).to.throw(Error);
      expect(averager.appendSample([2.000001, 15])).to.be.null;
      expect(averager.appendSample([30, 15])).to.deep.equal([1.25000025, 13.75]);
      expect(function() {averager.appendSample([29.9999, 15])}).to.throw(Error);
   });

   it('should throw an Error if a sample is added with missing expected channels', function() {
      const averager = new TimeBinnedAverager(30, 3);
      expect(function() {averager.appendSample([1])}).to.throw(Error);
      expect(function() {averager.appendSample([2, 10])}).to.throw(Error);
      expect(function() {averager.appendSample([3, 10, 20])}).to.throw(Error);
      expect(averager.appendSample([3, 10, 20, 30])).to.be.null;
   });

   it('should skip non-numeric channel values', function() {
      const averager = new TimeBinnedAverager(30, 4);
      let x;
      expect(averager.appendSample([1, 10, 20, 30, 100])).to.be.null;
      expect(averager.appendSample([2, 11, 21, 31, null])).to.be.null;
      expect(averager.appendSample([3, 12, 22, 32, null])).to.be.null;
      expect(averager.appendSample([4, 13, null, 33, null])).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal([2.5, 11.5, 21, 31.5, 100]);
      expect(averager.appendSample([5, , "foo", x, 100])).to.be.null;
      expect(averager.appendSample([6, , "10", x, null])).to.be.null;
      expect(averager.appendSample([7, , [], x, null])).to.be.null;
      expect(averager.appendSample([8, , new Date(), x, null])).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal([4.5, 11.5, 18.25, 31.5, 100]);
   });

   it('should return null as long as samples are added to the same time bin, but return the average sample when new bins are started', function() {
      const averager = new TimeBinnedAverager(30, 1);
      expect(averager.appendSample([0, 10])).to.be.null;
      expect(averager.appendSample([1, 15])).to.be.null;
      expect(averager.appendSample([2, 17])).to.be.null;
      expect(averager.appendSample([30, 100])).to.deep.equal([1, 14]);
      expect(averager.computeAverageSample()).to.deep.equal([30, 100]);
      expect(averager.appendSample([65, 42.000343])).to.deep.equal([30, 100]);
      expect(averager.appendSample([65.0001, 74])).to.be.null;
      expect(averager.appendSample([65.0002, 19.23823])).to.be.null;
      expect(averager.appendSample([89.9999, 34233])).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal([71.25005, 8592.05964325]);
      expect(averager.appendSample([90, 1])).to.deep.equal([71.25005, 8592.05964325]);
      expect(averager.computeAverageSample()).to.deep.equal([90, 1]);

      let x;
      const averager2 = new TimeBinnedAverager(30, 3);
      expect(averager2.appendSample([1, 10, 2, 42])).to.be.null;
      expect(averager2.appendSample([8, 11, 4, null])).to.be.null;
      expect(averager2.appendSample([15, 12, 8, null])).to.be.null;
      expect(averager2.appendSample([22, 13, 16, null])).to.be.null;
      expect(averager2.appendSample([29, 14, 32, null])).to.be.null;
      expect(averager2.appendSample([36, 15, 64, null])).to.deep.equal([15, 12, 12.4, 42]);
      expect(averager2.appendSample([43, 16, 128, null])).to.be.null;
      expect(averager2.appendSample([50, 17, 256, null])).to.be.null;
      expect(averager2.appendSample([57, 18, 512, null])).to.be.null;
      expect(averager2.appendSample([64, 19, 1024, x])).to.deep.equal([46.5, 16.5, 240, null]);
      expect(averager2.appendSample([71, 20, 2048, x])).to.be.null;
      expect(averager2.appendSample([78, 21, 4096, x])).to.be.null;
      expect(averager2.appendSample([85, 22, 8192, x])).to.be.null;
      expect(averager2.appendSample([92, 23, 16384, x])).to.deep.equal([74.5, 20.5, 3840, null]);
   });
})

describe('computeAverageSample()', function() {
   it('should return null if no samples have been added', function() {
      const averager = new TimeBinnedAverager(30, 1);
      expect(averager.computeAverageSample()).to.be.null;
   });

   it('should return the correct averaged timestamp and value(s) as samples are appended', function() {
      const averager = new TimeBinnedAverager(30, 1);
      expect(averager.appendSample([0, 10])).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal([0, 10]);
      expect(averager.appendSample([1, 15])).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal([.5, 12.5]);
      expect(averager.appendSample([2, 17])).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal([1, 14]);
   });
});