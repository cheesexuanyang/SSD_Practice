import { expect } from 'chai';
import request from 'supertest';
import { getCurrentTimestamp, server } from '../src/server.js';

describe('Timestamp Function', () => {
  it('should return a valid ISO timestamp', () => {
    const timestamp = getCurrentTimestamp();
    // Check if it's a valid ISO string
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(timestamp).to.match(isoRegex);
    console.log('✓ Timestamp format is valid');
  });

  it('should return the current timestamp', () => {
    const timestamp = getCurrentTimestamp();
    const now = new Date().toISOString();
    const timeDiff = Math.abs(new Date(timestamp) - new Date(now));
    expect(timeDiff).to.be.below(1000); // Should be within 1 second
    console.log('✓ Timestamp is current');
  });
});

describe('API Endpoints', () => {
  it('should return timestamp from /timestamp endpoint', (done) => {
    request(server)
      .get('/timestamp')
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('timestamp');
        expect(res.body.timestamp).to.be.a('string');
        console.log('✓ /timestamp endpoint works');
        done();
      });
  });

  it('should return HTML from root endpoint', (done) => {
    request(server)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).to.include('Browser and Timestamp Info');
        console.log('✓ Root endpoint returns HTML');
        done();
      });
  });

  // Close the server after all tests
  after(() => {
    server.close();
    console.log('Server closed after tests');
  });
});