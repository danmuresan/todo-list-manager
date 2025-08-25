import app from './app';
import { container } from './di/di-container';

const PORT: number = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, (): void => {
    container.logger.log(`Server listening on http://localhost:${PORT}`);
});
