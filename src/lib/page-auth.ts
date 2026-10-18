import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentUser, type Role } from './auth';
export async function pageUser(role?: Role) {
    const h = await headers();
    const user = (await currentUser(new Request('http://localhost', { headers: { cookie: h.get('cookie') || '' } })));
    if (!user)
        redirect('/login');
    if (role && user.role !== role)
        redirect(`/${user.role}`);
    return user;
}
