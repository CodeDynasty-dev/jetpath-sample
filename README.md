# Jetpath: Cross-runtime Framework Sample

## Modern Web Development, Simplified

Jetpath is a cutting-edge TypeScript framework designed for developers who demand performance, simplicity, and an exceptional developer experience.

### Why Jetpath?

- **High Performance**: Lightning-fast web applications
- **Type Safety**: Robust TypeScript type system
- **Minimal Boilerplate**: Clean, concise code

### Key Features

1. **Intuitive Routing**
   Create routes by simply adding files in the `src/app` directory:

   ```typescript
   // Automatically creates a GET /user endpoint
   export const GET_user: JetRoute = async (ctx) => {
     const user = ctx.state.user;
     ctx.send(user);
   };
   ```

2. **Built-in API Documentation**
   Secure authentication with minimal configuration:

   ```typescript
   export const POST_o_user_login: JetRoute<{
     body: { password: string; email: string };
   }> = async (ctx) => {
     // Type-safe authentication & Documented automatically
   };
   use(POST_o_user_login).body((t) => {
     return {
       email: t.string().email().required(),
       password: t.string().required().min(4).max(128),
     };
   });
   ```

3. **Flexible API Management**
   Easily define and manage api endpoints:

   ```typescript
   export const GET_products: JetRoute = async (ctx) => {
     const products = await Product.find();
     ctx.send(products);
   };
   ```

### Quick Start

```bash
# Install Jetpath CLI
npx jetpath new-project

# Navigate to the project directory
cd new-project

# Install dependencies
npm install

# Start development server
npm run dev
```

### Core Capabilities

- File-based routing
- Type-safe API development
- Built-in authentication
- Database agnostic
- Serverless deployment ready

### Project Structure

```
src/
├── app/           # Route handlers
├── db/            # Database models
├── main.jet.ts    # Application entry point
└── ...
```

### Ecosystem

- Works with multiple frontend frameworks
- Scalable from small projects to enterprise applications
- Easy middleware and plugin integration

### Deployment

Jetpath is deployment ready, you can deploy it on any hosting platform.
this example is deployed on `fly.io` using fly cli.

### Contributing

Contributions are welcome! Check our [contribution guidelines](https://github.com/CodeDynasty-dev/Jetpath/blob/main/contributing.md).

### License

MIT License

### Community

Join our [Discord](https://discord.gg/faqydQASTy) for support and discussions!

---

**Crafted with ❤️ by CodeDynasty.dev**
