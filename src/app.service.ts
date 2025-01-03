import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  postHello() {
    return 'Desde @Post en el service';
  }
}
