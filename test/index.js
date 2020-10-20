// noinspection JSUnusedLocalSymbols
const should = require('should');
const expect = require('chai').expect;

const TimeBinnedAverager = require('../index');

describe('constructor', function() {
   it('should throw a TypeError if binSizeSeconds is undefined', function() {
      expect(function() {new TimeBinnedAverager();}).to.throw(TypeError);
      let x;
      expect(function() {new TimeBinnedAverager(x, ['foo']);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is null', function() {
      expect(function() {new TimeBinnedAverager(null);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(null, ['foo']);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is negative', function() {
      expect(function() {new TimeBinnedAverager(-1);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(-42.42);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(-1, ['foo']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(-42.42, ['foo']);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is zero', function() {
      expect(function() {new TimeBinnedAverager(0);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(0, ['foo']);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is numeric and positive, but not an integer', function() {
      expect(function() {new TimeBinnedAverager(0.04);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(42.42);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(0.04, ['foo']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(42.42, ['foo']);}).to.throw(TypeError);
   });
   it('should throw a TypeError if binSizeSeconds is not an integer', function() {
      expect(function() {new TimeBinnedAverager(['hi']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager({});}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager({ foo : 'bar' });}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager("hello world");}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(new Set());}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(new Date());}).to.throw(TypeError);
   });
   it('should throw a TypeError if channelNames is not an Array', function() {
      expect(function() {new TimeBinnedAverager(30);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, null);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, 4);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, 4.2);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, {});}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, { foo : 'bar' });}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, "hello world");}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, new Set());}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, new Date());}).to.throw(TypeError);
   });
   it('should throw a TypeError if channelNames is an empty Array', function() {
      expect(function() {new TimeBinnedAverager(30, []);}).to.throw(TypeError);
   });
   it('should throw a TypeError if channelNames contains one or more items that are not Strings', function() {
      expect(function() {new TimeBinnedAverager(30, ['c1', 2]);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, [1, 'c1']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, ['c1', {}, 'c2']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, ['c1', [], 'c2']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, ['c1', null, 'c2']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, ['c1', new Date(), 'c2']);}).to.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, ['c1', 42.42, 'c2']);}).to.throw(TypeError);
   });
   it('should succeed if binSizeSeconds is a positive integer and channelNames is a non-empty Array containing one or more Strings', function() {
      expect(function() {new TimeBinnedAverager(30, ['c1']);}).to.not.throw(TypeError);
      expect(function() {new TimeBinnedAverager(30, ['c1', 'c2']);}).to.not.throw(TypeError);
   });
});

describe('appendSample()', function() {
   it('should throw a TypeError if unixTimeSeconds is not numeric', function() {
      const averager = new TimeBinnedAverager(30, ['voltage']);
      let x;
      expect(function() {averager.appendSample(null, { voltage : 15 })}).to.throw(TypeError);
      expect(function() {averager.appendSample(x, { voltage : 15 })}).to.throw(TypeError);
      expect(function() {averager.appendSample("", { voltage : 15 })}).to.throw(TypeError);
      expect(function() {averager.appendSample("hello!", { voltage : 15 })}).to.throw(TypeError);
      expect(function() {averager.appendSample({}, { voltage : 15 })}).to.throw(TypeError);
      expect(function() {averager.appendSample([], { voltage : 15 })}).to.throw(TypeError);
      expect(function() {averager.appendSample(new Date(), { voltage : 15 })}).to.throw(TypeError);
   });

   it('should throw an Error if samples are not added with strictly increasing timestamps', function() {
      const averager = new TimeBinnedAverager(30, ['voltage']);
      expect(averager.appendSample(0, { voltage : 10 })).to.be.null;
      expect(averager.appendSample(1, { voltage : 15 })).to.be.null;
      expect(function() {averager.appendSample(1, { voltage : 15 })}).to.throw(Error);
      expect(averager.appendSample(2, { voltage : 15 })).to.be.null;
      expect(function() {averager.appendSample(1.5, { voltage : 15 })}).to.throw(Error);
      expect(function() {averager.appendSample(1.9999, { voltage : 15 })}).to.throw(Error);
      expect(averager.appendSample(2.000001, { voltage : 15 })).to.be.null;
   });

   it('should throw an Error if a sample is added with missing expected channels', function() {
      const averager = new TimeBinnedAverager(30, ['c1', 'c2']);
      expect(function() {averager.appendSample(1, { c1 : 1 })}).to.throw(Error);
      expect(function() {averager.appendSample(2, { c2 : 2 })}).to.throw(Error);
      expect(function() {averager.appendSample(3, { c3 : 3 })}).to.throw(Error);
   });

   it('should throw a TypeError if a sample is added with non-numeric channel values', function() {
      const averager = new TimeBinnedAverager(30, ['c1']);
      expect(averager.appendSample(1, { c1 : 1 })).to.be.null;
      expect(averager.appendSample(2, { c1 : "2" })).to.be.null;
      expect(averager.appendSample(3, { c1 : "3.0" })).to.be.null;
      expect(function() {averager.appendSample(4, { c1 : "cat" })}).to.throw(TypeError);
      expect(function() {averager.appendSample(4, { c1 : [] })}).to.throw(TypeError);
      expect(function() {averager.appendSample(4, { c1 : {} })}).to.throw(TypeError);
      expect(function() {averager.appendSample(4, { c1 : new Date() })}).to.throw(TypeError);
      expect(function() {averager.appendSample(4, { c1 : null })}).to.throw(TypeError);
   });

   it('should return null as long as samples are added to the same time bin, but return the average sample when new bins are started', function() {
      const averager = new TimeBinnedAverager(30, ['voltage']);
      expect(averager.appendSample(0, { voltage : 10 })).to.be.null;
      expect(averager.appendSample(1, { voltage : 15 })).to.be.null;
      expect(averager.appendSample(2, { voltage : 17 })).to.be.null;
      expect(averager.appendSample(30, { voltage : 100 })).to.deep.equal({ timestamp : 1, values : { voltage : 14 } });
      expect(averager.computeAverageSample()).to.deep.equal({ timestamp : 30, values : { voltage : 100 } });
      expect(averager.appendSample(65, { voltage : 42.000343 })).to.deep.equal({
                                                                                  timestamp : 30,
                                                                                  values : { voltage : 100 }
                                                                               });
      expect(averager.appendSample(65.0001, { voltage : 74 })).to.be.null;
      expect(averager.appendSample(65.0002, { voltage : 19.23823 })).to.be.null;
      expect(averager.appendSample(89.9999, { voltage : 34233 })).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal({
                                                               timestamp : 71.25005,
                                                               values : { voltage : 8592.05964325 }
                                                            });
      expect(averager.appendSample(90, { voltage : 1 })).to.deep.equal({
                                                                          timestamp : 71.25005,
                                                                          values : { voltage : 8592.05964325 }
                                                                       });
   });
})

describe('computeAverageSample()', function() {
   it('should return null if no samples have been added', function() {
      const averager = new TimeBinnedAverager(30, ['voltage']);
      expect(averager.computeAverageSample()).to.be.null;
   });

   it('should return the correct averaged timestamp and value(s) as samples are appended', function() {
      const averager = new TimeBinnedAverager(30, ['voltage']);
      expect(averager.appendSample(0, { voltage : 10 })).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal({ timestamp : 0, values : { voltage : 10 } });
      expect(averager.appendSample(1, { voltage : 15 })).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal({ timestamp : .5, values : { voltage : 12.5 } });
      expect(averager.appendSample(2, { voltage : 17 })).to.be.null;
      expect(averager.computeAverageSample()).to.deep.equal({ timestamp : 1, values : { voltage : 14 } });
   });
});