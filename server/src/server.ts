import app from './app';

const PORT: number = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, (): void => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
});
