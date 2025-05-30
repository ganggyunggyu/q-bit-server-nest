import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // ✅ 추가
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/your-db-name'), // ✅ 여기에 연결 URI 입력
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
