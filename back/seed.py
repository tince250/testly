from sqlmodel import select
from model.database import session
from model.user import User, UserRole, UserCourseLink
from model.course import Course
from model.keyword import Keyword, KeywordHierarchy


async def seed_if_empty() -> None:
    """Populate the database with sample data for testing, only if it has no users yet."""
    async with session() as s:
        if (await s.execute(select(User))).scalars().first():
            return

        professor = User(email="prof@test.com", password="pw", name="Petar", lastname="Petrovic", role=UserRole.PROFESSOR)
        student1 = User(email="student1@test.com", password="pw", name="Ana", lastname="Anic", role=UserRole.STUDENT)
        student2 = User(email="student2@test.com", password="pw", name="Marko", lastname="Markovic", role=UserRole.STUDENT)
        s.add_all([professor, student1, student2])
        await s.commit()

        course = Course(name="Biology")
        s.add(course)
        await s.commit()
        await s.refresh(course)

        root = Keyword(name="Biology", definition="Root for course: Biology", parent_id=None)
        s.add(root)
        await s.commit()
        await s.refresh(root)

        hierarchy = KeywordHierarchy(root_id=root.id)
        s.add(hierarchy)
        await s.commit()
        await s.refresh(hierarchy)

        cell = Keyword(name="Cell Biology", definition="Study of cells", parent_id=root.id)
        genetics = Keyword(name="Genetics", definition="Study of genes", parent_id=root.id)
        s.add_all([cell, genetics])
        await s.commit()
        await s.refresh(cell)
        await s.refresh(genetics)

        leaves = [
            ("Mitochondria", "The powerhouse of the cell", cell.id),
            ("Ribosome", "Site of protein synthesis", cell.id),
            ("DNA", "Molecule carrying genetic instructions", genetics.id),
            ("Gene", "Basic unit of heredity", genetics.id),
        ]
        s.add_all([Keyword(name=name, definition=definition, parent_id=parent_id) for name, definition, parent_id in leaves])
        await s.commit()

        course.keyword_hierarchy_id = hierarchy.id
        s.add_all([
            course,
            UserCourseLink(user_id=professor.id, course_id=course.id),
            UserCourseLink(user_id=student1.id, course_id=course.id),
            UserCourseLink(user_id=student2.id, course_id=course.id),
        ])
        await s.commit()
