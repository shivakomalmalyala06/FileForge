from fastapi import FastAPI
app = FastAPI(title='FileForge API')

@app.get('/')
def root():
    return {'status': 'active'}
