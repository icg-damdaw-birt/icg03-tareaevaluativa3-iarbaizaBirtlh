const request = require('supertest');
const app = require('../server');
const prisma = require('../lib/prisma');

jest.mock('../lib/prisma', () => ({
    movie: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
    },
}));

jest.mock('../middleware/authMiddleware', () => {
    return (req, res, next) => {
        req.user = { userId: 'user-123' }; 
        next();
    };
});

describe('PATCH /api/movies/:id/rating', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debería actualizar el rating correctamente cuando los datos son válidos', async () => {
        const peliculaMock = {
        id: 'movie-1',
        ownerId: 'user-123',
        rating: 4,
        };
        
        prisma.movie.findFirst.mockResolvedValue(peliculaMock);
        prisma.movie.updateMany.mockResolvedValue({ count: 1 });
        prisma.movie.update.mockResolvedValue(peliculaMock);

        const res = await request(app)
        .patch('/api/movies/movie-1/rating')
        .send({ rating: 4 })
        .set('Authorization', 'Bearer fake-token');

        expect(res.statusCode).toBe(200);
        const ratingRecibido = res.body.rating !== undefined ? res.body.rating : res.body.movie?.rating;
        expect(ratingRecibido).toBe(4);
    });

    it('debería devolver 400 si el rating es mayor a 5', async () => {
        const res = await request(app)
        .patch('/api/movies/movie-1/rating')
        .send({ rating: 6 })
        .set('Authorization', 'Bearer fake-token');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Rating must be between 0 and 5');
    });

    it('debería devolver 400 si el rating es negativo', async () => {
        const res = await request(app)
        .patch('/api/movies/movie-1/rating')
        .send({ rating: -1 })
        .set('Authorization', 'Bearer fake-token');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Rating must be between 0 and 5');
    });

    it('debería devolver 404 si la película no existe o no pertenece al usuario', async () => {
        prisma.movie.findFirst.mockResolvedValue(null);
        const res = await request(app)
        .patch('/api/movies/movie-noexiste/rating')
        .send({ rating: 3 })
        .set('Authorization', 'Bearer fake-token');
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Movie not found');
    });

    it('debería devolver 400 si no se envía rating en el cuerpo de la petición', async () => {
        const res = await request(app)
        .patch('/api/movies/movie-1/rating')
        .send({})
        .set('Authorization', 'Bearer fake-token');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Rating must be between 0 and 5');
    });
});